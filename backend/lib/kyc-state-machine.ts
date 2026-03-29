/**
 * KYC status finite state machine.
 *
 * Defines the set of valid statuses and which transitions are allowed.
 * Once a user reaches "verified", they cannot be downgraded.
 */

export const KYC_STATUSES = [
	'unverified',
	'pending',
	'verified',
	'requires_input',
] as const;

export type KycStatus = (typeof KYC_STATUSES)[number];

/**
 * Map of allowed transitions: `from → Set<to>`.
 *
 * Rules:
 *   unverified    → pending           (admin starts verification)
 *   pending       → verified          (Stripe confirms identity)
 *   pending       → requires_input    (Stripe needs more info)
 *   requires_input → pending          (admin re-starts verification)
 *   verified      → (nothing)         (terminal state, no downgrade)
 */
const ALLOWED_TRANSITIONS: Record<KycStatus, ReadonlySet<KycStatus>> = {
	unverified: new Set<KycStatus>(['pending']),
	pending: new Set<KycStatus>(['verified', 'requires_input']),
	requires_input: new Set<KycStatus>(['pending']),
	verified: new Set<KycStatus>(), // terminal — no outgoing transitions
};

/**
 * Check whether transitioning from `current` to `next` is allowed.
 */
export function isValidTransition(current: KycStatus, next: KycStatus): boolean {
	const allowed = ALLOWED_TRANSITIONS[current];
	return allowed ? allowed.has(next) : false;
}

/**
 * Returns a human-readable reason why the transition was rejected,
 * or `null` if the transition is valid.
 */
export function transitionError(
	current: KycStatus,
	next: KycStatus,
): string | null {
	if (isValidTransition(current, next)) return null;

	if (current === 'verified') {
		return `Cannot change status from "verified" — identity verification is final`;
	}

	return `Invalid KYC status transition: "${current}" → "${next}"`;
}
