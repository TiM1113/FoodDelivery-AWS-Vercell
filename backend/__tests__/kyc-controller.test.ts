/**
 * @generated Codex (gpt-5.4) — 2026-03-30
 * @spec Phase 5 Step 3
 */

import { desc } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { kycAuditLogs } from '../db/schema';

const mockState = vi.hoisted(() => {
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_BUCKET_NAME = 'test-bucket';
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';

  const testUserId = '11111111-1111-4111-8111-111111111111';

  const selectArgs: unknown[] = [];
  const selectWhereCalls: unknown[] = [];
  const selectOrderByCalls: unknown[][] = [];
  const selectLimitCalls: number[] = [];
  const selectLimitQueue: unknown[][] = [];

  const txSelectArgs: unknown[] = [];
  const txSelectWhereCalls: unknown[] = [];
  const txSelectLimitCalls: number[] = [];
  const txSelectLimitQueue: unknown[][] = [];
  const txUpdateSetCalls: Array<Record<string, unknown>> = [];
  const txUpdateWhereCalls: unknown[] = [];
  const txUpdateReturningQueue: unknown[][] = [];
  const txInsertValuesCalls: Array<Record<string, unknown>> = [];

  const refundsCreate = vi.fn();
  const verificationSessionsCreate = vi.fn();
  const webhooksConstructEvent = vi.fn();

  const StripeMock = vi.fn(function StripeMock() {
    return {
      refunds: {
        create: refundsCreate,
      },
      webhooks: {
        constructEvent: webhooksConstructEvent,
      },
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      promotionCodes: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      identity: {
        verificationSessions: {
          create: verificationSessionsCreate,
          retrieve: vi.fn(),
        },
      },
    };
  });

  const createSelectBuilder = (
    limitQueue: unknown[][],
    whereCalls?: unknown[],
    orderByCalls?: unknown[][],
    limitCalls?: number[],
  ) => {
    const builder = {
      where: vi.fn((condition: unknown) => {
        whereCalls?.push(condition);
        return builder;
      }),
      orderBy: vi.fn((...clauses: unknown[]) => {
        orderByCalls?.push(clauses);
        return builder;
      }),
      limit: vi.fn(async (value: number) => {
        limitCalls?.push(value);
        return limitQueue.shift() ?? [];
      }),
    };

    return builder;
  };

  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn(async (values: Record<string, unknown>) => {
        txInsertValuesCalls.push(values);
        return [];
      }),
    })),
    select: vi.fn((fields?: unknown) => {
      txSelectArgs.push(fields);

      return {
        from: vi.fn(() =>
          createSelectBuilder(txSelectLimitQueue, txSelectWhereCalls, undefined, txSelectLimitCalls),
        ),
      };
    }),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        txUpdateSetCalls.push(values);

        return {
          where: vi.fn((condition: unknown) => {
            txUpdateWhereCalls.push(condition);

            return {
              returning: vi.fn(async () => txUpdateReturningQueue.shift() ?? []),
            };
          }),
        };
      }),
    })),
  };

  const db = {
    select: vi.fn((fields?: unknown) => {
      selectArgs.push(fields);

      return {
        from: vi.fn(() =>
          createSelectBuilder(selectLimitQueue, selectWhereCalls, selectOrderByCalls, selectLimitCalls),
        ),
      };
    }),
    transaction: vi.fn(async (callback: (tx: typeof tx) => Promise<unknown> | unknown) => callback(tx)),
  };

  const S3ClientMock = vi.fn(function S3ClientMock() {
    return {
      send: vi.fn(),
    };
  });

  const PutObjectCommandMock = vi.fn(function PutObjectCommandMock(input: unknown) {
    return { input };
  });

  const DeleteObjectCommandMock = vi.fn(function DeleteObjectCommandMock(input: unknown) {
    return { input };
  });

  const getSignedUrl = vi.fn();

  const reset = () => {
    selectArgs.length = 0;
    selectWhereCalls.length = 0;
    selectOrderByCalls.length = 0;
    selectLimitCalls.length = 0;
    selectLimitQueue.length = 0;

    txSelectArgs.length = 0;
    txSelectWhereCalls.length = 0;
    txSelectLimitCalls.length = 0;
    txSelectLimitQueue.length = 0;
    txUpdateSetCalls.length = 0;
    txUpdateWhereCalls.length = 0;
    txUpdateReturningQueue.length = 0;
    txInsertValuesCalls.length = 0;

    refundsCreate.mockReset();
    verificationSessionsCreate.mockReset();
    webhooksConstructEvent.mockReset();

    StripeMock.mockClear();
    db.select.mockClear();
    db.transaction.mockClear();
    tx.insert.mockClear();
    tx.select.mockClear();
    tx.update.mockClear();

    S3ClientMock.mockClear();
    PutObjectCommandMock.mockClear();
    DeleteObjectCommandMock.mockClear();
    getSignedUrl.mockReset();
  };

  return {
    DeleteObjectCommandMock,
    PutObjectCommandMock,
    S3ClientMock,
    StripeMock,
    db,
    getSignedUrl,
    refundsCreate,
    reset,
    selectArgs,
    selectLimitCalls,
    selectLimitQueue,
    selectOrderByCalls,
    selectWhereCalls,
    testUserId,
    txInsertValuesCalls,
    txSelectArgs,
    txSelectLimitCalls,
    txSelectLimitQueue,
    txSelectWhereCalls,
    txUpdateReturningQueue,
    txUpdateSetCalls,
    txUpdateWhereCalls,
    verificationSessionsCreate,
    webhooksConstructEvent,
  };
});

vi.mock('../db', () => ({
  db: mockState.db,
}));

vi.mock('../middleware/auth', () => ({
  default: async (c: { set: (key: string, value: string) => void }, next: () => Promise<void>) => {
    c.set('userId', mockState.testUserId);
    await next();
  },
}));

vi.mock('../middleware/adminMiddleware', () => ({
  default: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

vi.mock('stripe', () => ({
  default: mockState.StripeMock,
}));

vi.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: mockState.DeleteObjectCommandMock,
  PutObjectCommand: mockState.PutObjectCommandMock,
  S3Client: mockState.S3ClientMock,
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockState.getSignedUrl,
}));

import app from '../app';

const dialect = new PgDialect();

const getJson = async (path: string, headers: Record<string, string> = {}) => {
  const res = await app.request(path, {
    method: 'GET',
    headers,
  });
  const body = await res.json();

  return { body, res };
};

const postJson = async (path: string, body: unknown, headers: Record<string, string> = {}) => {
  const res = await app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  return res;
};

const renderSql = (expression: unknown) => dialect.sqlToQuery(expression as never).sql.toLowerCase();

const makeVerificationEvent = (
  type: 'identity.verification_session.verified' | 'identity.verification_session.requires_input',
  sessionId = 'vs_123',
  userId = mockState.testUserId,
) => ({
  id: 'evt_123',
  type,
  data: {
    object: {
      id: sessionId,
      metadata: { userId },
    },
  },
});

beforeEach(() => {
  mockState.reset();
});

describe('KYC controller', () => {
  it('returns the current KYC status', async () => {
    mockState.selectLimitQueue.push([{ kycStatus: 'unverified', kycSessionId: null }]);

    const { res, body } = await getJson('/api/kyc/status');

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        status: 'unverified',
        sessionId: null,
      },
    });
  });

  it('returns 404 when the status user is missing', async () => {
    mockState.selectLimitQueue.push([]);

    const { res, body } = await getJson('/api/kyc/status');

    expect(res.status).toBe(404);
    expect(body).toEqual({ success: false, message: 'User not found' });
  });

  it('creates a verification session and writes an audit log from unverified', async () => {
    mockState.selectLimitQueue.push([{ kycStatus: 'unverified' }]);
    mockState.verificationSessionsCreate.mockResolvedValue({
      id: 'vs_123',
      client_secret: 'cs_xxx',
      url: 'https://stripe.test/session/vs_123',
    });
    mockState.txSelectLimitQueue.push([{ kycStatus: 'unverified' }]);
    mockState.txUpdateReturningQueue.push([{ id: mockState.testUserId }]);

    const res = await postJson('/api/kyc/create-session', {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        sessionId: 'vs_123',
        clientSecret: 'cs_xxx',
        url: 'https://stripe.test/session/vs_123',
      },
    });
    expect(mockState.verificationSessionsCreate).toHaveBeenCalledWith({
      type: 'document',
      metadata: { userId: mockState.testUserId },
      options: {
        document: { require_matching_selfie: true },
      },
    });
    expect(mockState.db.transaction).toHaveBeenCalledTimes(1);
    expect(mockState.txUpdateSetCalls[0]).toEqual({
      kycStatus: 'pending',
      kycSessionId: 'vs_123',
    });
    expect(mockState.txInsertValuesCalls[0]).toEqual({
      userId: mockState.testUserId,
      previousStatus: 'unverified',
      newStatus: 'pending',
      trigger: 'admin_action',
      stripeSessionId: 'vs_123',
    });
  });

  it('blocks session creation when the user is already verified', async () => {
    mockState.selectLimitQueue.push([{ kycStatus: 'verified' }]);

    const res = await postJson('/api/kyc/create-session', {});
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('verified');
    expect(body.message).toContain('final');
    expect(mockState.verificationSessionsCreate).not.toHaveBeenCalled();
    expect(mockState.db.transaction).not.toHaveBeenCalled();
  });

  it('returns 409 when the status changes concurrently during session creation', async () => {
    mockState.selectLimitQueue.push([{ kycStatus: 'unverified' }]);
    mockState.verificationSessionsCreate.mockResolvedValue({
      id: 'vs_123',
      client_secret: 'cs_xxx',
      url: 'https://stripe.test/session/vs_123',
    });
    mockState.txSelectLimitQueue.push([{ kycStatus: 'pending' }]);

    const res = await postJson('/api/kyc/create-session', {});
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({
      success: false,
      message: 'Status changed concurrently, please retry',
    });
    expect(mockState.verificationSessionsCreate).toHaveBeenCalledTimes(1);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
    expect(mockState.txInsertValuesCalls).toHaveLength(0);
  });

  it('accepts a verified webhook and updates status atomically', async () => {
    mockState.webhooksConstructEvent.mockReturnValue(
      makeVerificationEvent('identity.verification_session.verified'),
    );
    mockState.txSelectLimitQueue.push([{ kycStatus: 'pending', kycSessionId: 'vs_123' }]);
    mockState.txUpdateReturningQueue.push([{ id: mockState.testUserId }]);

    const res = await postJson(
      '/api/kyc/webhook',
      { id: 'evt_123' },
      { 'stripe-signature': 'sig_test' },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockState.webhooksConstructEvent).toHaveBeenCalledWith(
      JSON.stringify({ id: 'evt_123' }),
      'sig_test',
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    expect(mockState.db.transaction).toHaveBeenCalledTimes(1);
    expect(mockState.txUpdateSetCalls[0]).toEqual({ kycStatus: 'verified' });
    expect(mockState.txInsertValuesCalls[0]).toEqual({
      userId: mockState.testUserId,
      previousStatus: 'pending',
      newStatus: 'verified',
      trigger: 'webhook',
      stripeSessionId: 'vs_123',
      metadata: {
        stripeEventId: 'evt_123',
        stripeEventType: 'identity.verification_session.verified',
      },
    });
  });

  it('acknowledges but rejects a stale webhook with a mismatched session ID', async () => {
    mockState.webhooksConstructEvent.mockReturnValue(
      makeVerificationEvent('identity.verification_session.verified'),
    );
    mockState.txSelectLimitQueue.push([{ kycStatus: 'pending', kycSessionId: 'vs_999' }]);

    const res = await postJson(
      '/api/kyc/webhook',
      { id: 'evt_123' },
      { 'stripe-signature': 'sig_test' },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockState.db.transaction).toHaveBeenCalledTimes(1);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
    expect(mockState.txInsertValuesCalls).toHaveLength(0);
  });

  it('acknowledges but rejects downgrade webhooks once a user is verified', async () => {
    mockState.webhooksConstructEvent.mockReturnValue(
      makeVerificationEvent('identity.verification_session.requires_input'),
    );
    mockState.txSelectLimitQueue.push([{ kycStatus: 'verified', kycSessionId: 'vs_123' }]);

    const res = await postJson(
      '/api/kyc/webhook',
      { id: 'evt_123' },
      { 'stripe-signature': 'sig_test' },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockState.db.transaction).toHaveBeenCalledTimes(1);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
    expect(mockState.txInsertValuesCalls).toHaveLength(0);
  });

  it('returns 400 for an invalid webhook signature', async () => {
    mockState.webhooksConstructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });

    const res = await postJson(
      '/api/kyc/webhook',
      { id: 'evt_bad' },
      { 'stripe-signature': 'sig_bad' },
    );
    const text = await res.text();

    expect(res.status).toBe(400);
    expect(text).toContain('Webhook Error: bad sig');
    expect(mockState.db.transaction).not.toHaveBeenCalled();
  });

  it('returns recent audit log rows ordered by createdAt desc', async () => {
    const logs = [
      {
        id: 'log_3',
        previousStatus: 'pending',
        newStatus: 'verified',
        trigger: 'webhook',
        stripeSessionId: 'vs_123',
        createdAt: '2026-03-30T12:02:00.000Z',
      },
      {
        id: 'log_2',
        previousStatus: 'requires_input',
        newStatus: 'pending',
        trigger: 'admin_action',
        stripeSessionId: 'vs_123',
        createdAt: '2026-03-30T12:01:00.000Z',
      },
      {
        id: 'log_1',
        previousStatus: 'unverified',
        newStatus: 'pending',
        trigger: 'admin_action',
        stripeSessionId: 'vs_123',
        createdAt: '2026-03-30T12:00:00.000Z',
      },
    ];
    mockState.selectLimitQueue.push(logs);

    const { res, body } = await getJson('/api/kyc/audit-logs');

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: logs });
    expect(mockState.selectLimitCalls[0]).toBe(50);
    expect(mockState.selectOrderByCalls).toHaveLength(1);
    expect(renderSql(mockState.selectOrderByCalls[0][0])).toContain('desc');
    expect(renderSql(mockState.selectOrderByCalls[0][0])).toContain(
      renderSql(desc(kycAuditLogs.createdAt)),
    );
  });

  it('returns an empty audit log list when no rows exist', async () => {
    mockState.selectLimitQueue.push([]);

    const { res, body } = await getJson('/api/kyc/audit-logs');

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [] });
  });
});
