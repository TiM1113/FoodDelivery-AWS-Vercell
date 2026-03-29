/**
 * @generated Codex (gpt-5.4) — 2026-03-30
 * @spec Phase 5 Step 3
 */

import { describe, expect, it } from 'vitest';
import {
  KYC_STATUSES,
  isValidTransition,
  transitionError,
  type KycStatus,
} from '../lib/kyc-state-machine';

describe('KYC state machine', () => {
  it('allows every valid transition pair', () => {
    const validTransitions: Array<[KycStatus, KycStatus]> = [
      ['unverified', 'pending'],
      ['pending', 'verified'],
      ['pending', 'requires_input'],
      ['requires_input', 'pending'],
    ];

    for (const [current, next] of validTransitions) {
      expect(isValidTransition(current, next)).toBe(true);
    }
  });

  it('rejects every downgrade from the terminal verified state', () => {
    const invalidDowngrades: Array<[KycStatus, KycStatus]> = [
      ['verified', 'pending'],
      ['verified', 'requires_input'],
      ['verified', 'unverified'],
    ];

    for (const [current, next] of invalidDowngrades) {
      expect(isValidTransition(current, next)).toBe(false);
    }
  });

  it('rejects every other illegal non-terminal transition', () => {
    const otherIllegalTransitions: Array<[KycStatus, KycStatus]> = [
      ['unverified', 'verified'],
      ['unverified', 'requires_input'],
      ['pending', 'unverified'],
      ['requires_input', 'unverified'],
      ['requires_input', 'verified'],
    ];

    for (const [current, next] of otherIllegalTransitions) {
      expect(isValidTransition(current, next)).toBe(false);
    }
  });

  it('rejects same-state transitions for every status', () => {
    for (const status of KYC_STATUSES) {
      expect(isValidTransition(status, status)).toBe(false);
    }
  });

  it('returns null from transitionError for valid transitions', () => {
    expect(transitionError('unverified', 'pending')).toBeNull();
    expect(transitionError('pending', 'verified')).toBeNull();
    expect(transitionError('pending', 'requires_input')).toBeNull();
    expect(transitionError('requires_input', 'pending')).toBeNull();
  });

  it('returns descriptive errors for terminal and generic invalid transitions', () => {
    expect(transitionError('verified', 'pending')).toContain('verified');
    expect(transitionError('verified', 'pending')).toContain('final');
    expect(transitionError('unverified', 'verified')).toContain('Invalid');
  });
});
