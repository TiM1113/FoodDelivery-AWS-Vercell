import { Context } from 'hono';
import Stripe from 'stripe';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db';
import { users, kycAuditLogs } from '../db/schema';
import type { AppEnv } from '../types';
import {
	isValidTransition,
	transitionError,
	type KycStatus,
} from '../lib/kyc-state-machine';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ── Helpers ─────────────────────────────────────────────────

/**
 * Transition KYC status inside a transaction:
 *   1. Read current status
 *   2. Validate transition via state machine
 *   3. Conditional UPDATE (WHERE includes previous status to prevent TOCTOU)
 *   4. Write audit log entry
 *
 * Returns `{ success, error? }`.
 */
async function transitionKycStatus(opts: {
	userId: string;
	newStatus: KycStatus;
	trigger: 'admin_action' | 'webhook';
	stripeSessionId?: string | null;
	metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
	const { userId, newStatus, trigger, stripeSessionId, metadata } = opts;

	return db.transaction(async (tx) => {
		// Read current state
		const [user] = await tx
			.select({
				kycStatus: users.kycStatus,
				kycSessionId: users.kycSessionId,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return { success: false, error: 'User not found' };
		}

		const currentStatus = user.kycStatus as KycStatus;

		// Validate transition
		const err = transitionError(currentStatus, newStatus);
		if (err) {
			return { success: false, error: err };
		}

		// For webhook triggers, verify session ID matches
		if (trigger === 'webhook' && stripeSessionId && user.kycSessionId !== stripeSessionId) {
			return { success: false, error: 'Stale webhook: session ID mismatch' };
		}

		// Conditional update: WHERE includes current status to prevent TOCTOU race
		const whereConditions = trigger === 'webhook' && stripeSessionId
			? and(
				eq(users.id, userId),
				eq(users.kycStatus, currentStatus),
				eq(users.kycSessionId, stripeSessionId),
			)
			: and(eq(users.id, userId), eq(users.kycStatus, currentStatus));

		const updated = await tx
			.update(users)
			.set({ kycStatus: newStatus })
			.where(whereConditions)
			.returning({ id: users.id });

		if (updated.length === 0) {
			return { success: false, error: 'Concurrent status change detected' };
		}

		// Write audit log
		await tx.insert(kycAuditLogs).values({
			userId,
			previousStatus: currentStatus,
			newStatus,
			trigger,
			stripeSessionId: stripeSessionId ?? user.kycSessionId,
			metadata: metadata ?? null,
		});

		return { success: true };
	});
}

// ── Route handlers ──────────────────────────────────────────

/**
 * GET /api/kyc/status — current KYC status for the authenticated admin.
 */
export const getKycStatus = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');

		const [user] = await db
			.select({
				kycStatus: users.kycStatus,
				kycSessionId: users.kycSessionId,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return c.json({ success: false, message: 'User not found' }, 404);
		}

		return c.json({
			success: true,
			data: {
				status: user.kycStatus,
				sessionId: user.kycSessionId,
			},
		});
	} catch (error) {
		const err = error as Error;
		console.error('Error fetching KYC status:', err);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};

/**
 * POST /api/kyc/create-session — start a new Stripe Identity session.
 */
export const createVerificationSession = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');

		const [user] = await db
			.select({ kycStatus: users.kycStatus })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return c.json({ success: false, message: 'User not found' }, 404);
		}

		const currentStatus = user.kycStatus as KycStatus;

		// Pre-check: only allow starting from states that can reach "pending"
		if (!isValidTransition(currentStatus, 'pending')) {
			const reason = transitionError(currentStatus, 'pending');
			return c.json({ success: false, message: reason ?? 'Cannot start verification' }, 400);
		}

		// Create Stripe session
		const session = await stripe.identity.verificationSessions.create({
			type: 'document',
			metadata: { userId },
			options: {
				document: { require_matching_selfie: true },
			},
		});

		// Atomic transition: re-check status inside transaction to prevent race
		const transitioned = await db.transaction(async (tx) => {
			// Re-read status to guard against concurrent requests
			const [fresh] = await tx
				.select({ kycStatus: users.kycStatus })
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			const freshStatus = fresh?.kycStatus as KycStatus;
			if (!isValidTransition(freshStatus, 'pending')) {
				return false;
			}

			const updated = await tx
				.update(users)
				.set({ kycStatus: 'pending', kycSessionId: session.id })
				.where(and(eq(users.id, userId), eq(users.kycStatus, freshStatus)))
				.returning({ id: users.id });

			if (updated.length === 0) return false;

			await tx.insert(kycAuditLogs).values({
				userId,
				previousStatus: freshStatus,
				newStatus: 'pending',
				trigger: 'admin_action',
				stripeSessionId: session.id,
			});

			return true;
		});

		if (!transitioned) {
			return c.json({ success: false, message: 'Status changed concurrently, please retry' }, 409);
		}

		return c.json({
			success: true,
			data: {
				sessionId: session.id,
				clientSecret: session.client_secret,
				url: session.url,
			},
		});
	} catch (error) {
		const err = error as Error;
		console.error('Error creating verification session:', err);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};

/**
 * POST /api/kyc/webhook — Stripe Identity webhook handler.
 */
export const handleIdentityWebhook = async (c: Context<AppEnv>) => {
	const sig = c.req.header('stripe-signature');
	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		console.error('STRIPE_WEBHOOK_SECRET is not set');
		return c.json({ success: false, message: 'Webhook secret not configured' }, 500);
	}

	let event: Stripe.Event;
	try {
		const rawBody = await c.req.text();
		event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		const error = err as Error;
		console.error('Identity webhook signature verification failed:', error.message);
		return c.text(`Webhook Error: ${error.message}`, 400);
	}

	if (
		event.type === 'identity.verification_session.verified' ||
		event.type === 'identity.verification_session.requires_input'
	) {
		const session = event.data.object as Stripe.Identity.VerificationSession;
		const userId = session.metadata?.userId;

		if (userId) {
			const newStatus: KycStatus =
				event.type === 'identity.verification_session.verified'
					? 'verified'
					: 'requires_input';

			const result = await transitionKycStatus({
				userId,
				newStatus,
				trigger: 'webhook',
				stripeSessionId: session.id,
				metadata: { stripeEventId: event.id, stripeEventType: event.type },
			});

			if (result.success) {
				console.log(`KYC status updated for user ${userId}: ${newStatus}`);
			} else {
				console.log(`KYC transition rejected for user ${userId}: ${result.error}`);
			}
		}
	}

	return c.json({ received: true });
};

/**
 * GET /api/kyc/audit-logs — recent KYC audit log entries for the admin.
 */
export const getKycAuditLogs = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');

		const logs = await db
			.select({
				id: kycAuditLogs.id,
				previousStatus: kycAuditLogs.previousStatus,
				newStatus: kycAuditLogs.newStatus,
				trigger: kycAuditLogs.trigger,
				stripeSessionId: kycAuditLogs.stripeSessionId,
				createdAt: kycAuditLogs.createdAt,
			})
			.from(kycAuditLogs)
			.where(eq(kycAuditLogs.userId, userId))
			.orderBy(desc(kycAuditLogs.createdAt))
			.limit(50);

		return c.json({ success: true, data: logs });
	} catch (error) {
		const err = error as Error;
		console.error('Error fetching KYC audit logs:', err);
		return c.json({ success: false, message: 'Internal server error' }, 500);
	}
};
