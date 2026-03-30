import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const testUserId = '11111111-1111-4111-8111-111111111111';

  const selectArgs: unknown[] = [];
  const selectFromCalls: unknown[] = [];
  const selectWhereCalls: unknown[] = [];
  const selectWhereQueue: unknown[][] = [];
  const selectLimitCalls: number[] = [];
  const selectLimitQueue: unknown[][] = [];

  const updateSetCalls: Array<Record<string, unknown>> = [];
  const updateWhereCalls: unknown[] = [];
  const updateAwaitQueue: unknown[] = [];

  const StripeMock = vi.fn(function StripeMock() {
    return {
      refunds: {
        create: vi.fn(),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      promotionCodes: {
        list: vi.fn(),
        retrieve: vi.fn(),
      },
      identity: {
        verificationSessions: {
          create: vi.fn(),
          retrieve: vi.fn(),
        },
      },
    };
  });

  const createQueuedThenable = (
    queue: unknown[],
    fallback: unknown,
    extras: Record<string, unknown> = {},
  ) => {
    let resolved = false;
    let result: unknown;

    const getResult = () => {
      if (!resolved) {
        resolved = true;
        result = queue.length > 0 ? queue.shift() : fallback;
      }

      return result;
    };

    return {
      ...extras,
      then(onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(getResult()).then(onFulfilled, onRejected);
      },
      catch(onRejected?: (reason: unknown) => unknown) {
        return Promise.resolve(getResult()).catch(onRejected);
      },
      finally(onFinally?: () => void) {
        return Promise.resolve(getResult()).finally(onFinally);
      },
    };
  };

  const createSelectWhereBuilder = () =>
    vi.fn((condition: unknown) => {
      selectWhereCalls.push(condition);

      return createQueuedThenable(selectWhereQueue, [], {
        limit: vi.fn(async (value: number) => {
          selectLimitCalls.push(value);
          return selectLimitQueue.shift() ?? [];
        }),
      });
    });

  const db = {
    select: vi.fn((fields?: unknown) => {
      selectArgs.push(fields);

      return {
        from: vi.fn((table: unknown) => {
          selectFromCalls.push(table);

          return {
            where: createSelectWhereBuilder(),
          };
        }),
      };
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- avoid TS2502 circular reference with typeof tx
    transaction: vi.fn(async (callback: (tx: any) => Promise<unknown> | unknown) => callback({})),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        updateSetCalls.push(values);

        return {
          where: vi.fn((condition: unknown) => {
            updateWhereCalls.push(condition);

            return createQueuedThenable(updateAwaitQueue, []);
          }),
        };
      }),
    })),
  };

  const reset = () => {
    selectArgs.length = 0;
    selectFromCalls.length = 0;
    selectWhereCalls.length = 0;
    selectWhereQueue.length = 0;
    selectLimitCalls.length = 0;
    selectLimitQueue.length = 0;

    updateSetCalls.length = 0;
    updateWhereCalls.length = 0;
    updateAwaitQueue.length = 0;

    db.select.mockClear();
    db.transaction.mockClear();
    db.update.mockClear();
    StripeMock.mockClear();
  };

  return {
    StripeMock,
    db,
    reset,
    selectArgs,
    selectFromCalls,
    selectLimitCalls,
    selectLimitQueue,
    selectWhereCalls,
    selectWhereQueue,
    testUserId,
    updateAwaitQueue,
    updateSetCalls,
    updateWhereCalls,
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

vi.mock('../middleware/rateLimiter', () => ({
  loginRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  orderRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  profileRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  registerRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

vi.mock('stripe', () => ({
  default: mockState.StripeMock,
}));

import app from '../app';

const TEST_ORDER_ID = '22222222-2222-4222-8222-222222222222';
const UPDATE_STATUS_PATH = '/api/order/update';

const postJson = (path: string, body: unknown, headers: Record<string, string> = {}) => {
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

const postUpdateStatus = (body: unknown) => postJson(UPDATE_STATUS_PATH, body);

const buildOrder = (overrides: Record<string, unknown> = {}) => ({
  id: TEST_ORDER_ID,
  payment: true,
  status: 'Payment Pending',
  ...overrides,
});

beforeEach(() => {
  mockState.reset();
});

describe('updateStatus validation', () => {
  it('S1 rejects invalid status string', async () => {
    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID, status: 'InvalidStatus' });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Invalid status');
    expect(mockState.db.update).not.toHaveBeenCalled();
    expect(mockState.updateSetCalls).toHaveLength(0);
  });

  it('S2 accepts valid status "Food Processing"', async () => {
    mockState.selectLimitQueue.push([buildOrder({ payment: true })]);

    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID, status: 'Food Processing' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Status Updated' });
    expect(mockState.updateSetCalls).toEqual([{ status: 'Food Processing' }]);
    expect(mockState.updateWhereCalls).toHaveLength(1);
  });

  it('S3 accepts valid status "Delivered"', async () => {
    mockState.selectLimitQueue.push([buildOrder({ payment: true })]);

    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID, status: 'Delivered' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Status Updated' });
    expect(mockState.updateSetCalls).toEqual([{ status: 'Delivered' }]);
  });

  it('S4 rejects missing orderId', async () => {
    const res = await postUpdateStatus({ status: 'Food Processing' });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Missing orderId or status');
    expect(mockState.db.select).not.toHaveBeenCalled();
    expect(mockState.db.update).not.toHaveBeenCalled();
  });

  it('S5 rejects missing status', async () => {
    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Missing orderId or status');
    expect(mockState.db.select).not.toHaveBeenCalled();
    expect(mockState.db.update).not.toHaveBeenCalled();
  });

  it('S6 returns 404 for non-existent order', async () => {
    mockState.selectLimitQueue.push([]);

    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID, status: 'Food Processing' });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Order not found');
    expect(mockState.db.update).not.toHaveBeenCalled();
  });

  it('S7 rejects status change for unpaid order except Payment Pending', async () => {
    mockState.selectLimitQueue.push([buildOrder({ payment: false })]);

    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID, status: 'Food Processing' });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Cannot process unpaid orders');
    expect(mockState.db.update).not.toHaveBeenCalled();
    expect(mockState.updateSetCalls).toHaveLength(0);
  });

  it('S8 allows "Payment Pending" for unpaid order', async () => {
    mockState.selectLimitQueue.push([buildOrder({ payment: false })]);

    const res = await postUpdateStatus({ orderId: TEST_ORDER_ID, status: 'Payment Pending' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, message: 'Status Updated' });
    expect(mockState.updateSetCalls).toEqual([{ status: 'Payment Pending' }]);
    expect(mockState.updateWhereCalls).toHaveLength(1);
  });
});
