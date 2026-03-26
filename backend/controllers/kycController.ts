import { Context } from 'hono';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { AppEnv } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Get the current KYC verification status for the authenticated admin user.
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
		return c.json({ success: false, message: err.message }, 500);
	}
};

/**
 * Create a new Stripe Identity verification session for the admin user.
 */
export const createVerificationSession = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return c.json({ success: false, message: 'User not found' }, 404);
		}

		if (user.kycStatus === 'verified') {
			return c.json({
				success: false,
				message: 'Already verified',
			}, 400);
		}

		if (user.kycStatus === 'pending') {
			return c.json({
				success: false,
				message: 'Verification already in progress',
			}, 409);
		}

		const session = await stripe.identity.verificationSessions.create({
			type: 'document',
			metadata: {
				userId,
			},
			options: {
				document: {
					require_matching_selfie: true,
				},
			},
		});

		// Update user with session ID and pending status
		await db
			.update(users)
			.set({
				kycStatus: 'pending',
				kycSessionId: session.id,
			})
			.where(eq(users.id, userId));

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
		return c.json({ success: false, message: err.message }, 500);
	}
};

/**
 * Handle Stripe Identity webhook events.
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
			const newStatus = event.type === 'identity.verification_session.verified'
				? 'verified'
				: 'requires_input';

			// Only update if the webhook is for the user's current session
			const [user] = await db
				.select({ kycSessionId: users.kycSessionId })
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (user?.kycSessionId !== session.id) {
				return c.json({ received: true });
			}

			await db
				.update(users)
				.set({ kycStatus: newStatus })
				.where(eq(users.id, userId));

			console.log(`KYC status updated for user ${userId}: ${newStatus}`);
		}
	}

	return c.json({ received: true });
};
