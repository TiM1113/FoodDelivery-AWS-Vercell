import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const testUserId = '11111111-1111-4111-8111-111111111111';

  const txOperationLog: string[] = [];

  const txSelectArgs: unknown[] = [];
  const txSelectFromCalls: unknown[] = [];
  const txSelectWhereCalls: unknown[] = [];
  const txSelectForUpdateCalls: string[] = [];
  const txSelectForUpdateQueue: unknown[][] = [];
  const txSelectOrderByCalls: unknown[] = [];
  const txSelectLimitCalls: number[] = [];
  const txSelectLimitQueue: unknown[][] = [];

  const txUpdateSetCalls: Array<Record<string, unknown>> = [];
  const txUpdateWhereCalls: unknown[] = [];
  const txUpdateAwaitQueue: unknown[] = [];
  const txUpdateReturningQueue: unknown[][] = [];

  const txInsertCalls: unknown[] = [];
  const txInsertAwaitQueue: unknown[] = [];
  const txInsertReturningQueue: unknown[][] = [];

  const txDeleteWhereCalls: unknown[] = [];
  const txDeleteReturningQueue: unknown[][] = [];

  const checkoutSessionsCreate = vi.fn();
  const promotionCodesList = vi.fn();
  const promotionCodesRetrieve = vi.fn();
  const refundsCreate = vi.fn();
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
          create: checkoutSessionsCreate,
        },
      },
      promotionCodes: {
        list: promotionCodesList,
        retrieve: promotionCodesRetrieve,
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

  const labelUpdateSet = (values: Record<string, unknown>) => {
    const keys = Object.keys(values);

    if (keys.length === 1 && values.isDefault === false) {
      return 'clear-defaults';
    }

    if (keys.length === 1 && values.isDefault === true) {
      return 'promote-default';
    }

    return 'save-address';
  };

  const createTxSelectWhereBuilder = () =>
    vi.fn((condition: unknown) => {
      txSelectWhereCalls.push(condition);

      return createQueuedThenable([], [], {
        for: vi.fn(async (mode: string) => {
          txSelectForUpdateCalls.push(mode);
          txOperationLog.push(`select.for:${mode}`);
          return txSelectForUpdateQueue.shift() ?? [];
        }),
        limit: vi.fn(async (value: number) => {
          txSelectLimitCalls.push(value);
          return txSelectLimitQueue.shift() ?? [];
        }),
        orderBy: vi.fn((value: unknown) => {
          txSelectOrderByCalls.push(value);

          return {
            limit: vi.fn(async (limitValue: number) => {
              txSelectLimitCalls.push(limitValue);
              return txSelectLimitQueue.shift() ?? [];
            }),
          };
        }),
      });
    });

  const tx = {
    select: vi.fn((fields?: unknown) => {
      txSelectArgs.push(fields);

      return {
        from: vi.fn((table: unknown) => {
          txSelectFromCalls.push(table);

          return {
            where: createTxSelectWhereBuilder(),
          };
        }),
      };
    }),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        txUpdateSetCalls.push(values);
        txOperationLog.push(`update.set:${labelUpdateSet(values)}`);

        return {
          where: vi.fn((condition: unknown) => {
            txUpdateWhereCalls.push(condition);

            return createQueuedThenable(txUpdateAwaitQueue, [], {
              returning: vi.fn(async () => txUpdateReturningQueue.shift() ?? []),
            });
          }),
        };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((values: unknown) => {
        txInsertCalls.push(values);

        return createQueuedThenable(txInsertAwaitQueue, [], {
          returning: vi.fn(async () => txInsertReturningQueue.shift() ?? []),
        });
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn((condition: unknown) => {
        txDeleteWhereCalls.push(condition);

        return createQueuedThenable([], [], {
          returning: vi.fn(async () => txDeleteReturningQueue.shift() ?? []),
        });
      }),
    })),
  };

  const db = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- avoid TS2502 circular reference with typeof tx
    transaction: vi.fn(async (callback: (tx: any) => Promise<unknown> | unknown) => callback(tx)),
  };

  const reset = () => {
    txOperationLog.length = 0;

    txSelectArgs.length = 0;
    txSelectFromCalls.length = 0;
    txSelectWhereCalls.length = 0;
    txSelectForUpdateCalls.length = 0;
    txSelectForUpdateQueue.length = 0;
    txSelectOrderByCalls.length = 0;
    txSelectLimitCalls.length = 0;
    txSelectLimitQueue.length = 0;

    txUpdateSetCalls.length = 0;
    txUpdateWhereCalls.length = 0;
    txUpdateAwaitQueue.length = 0;
    txUpdateReturningQueue.length = 0;

    txInsertCalls.length = 0;
    txInsertAwaitQueue.length = 0;
    txInsertReturningQueue.length = 0;

    txDeleteWhereCalls.length = 0;
    txDeleteReturningQueue.length = 0;

    db.select.mockClear();
    db.update.mockClear();
    db.insert.mockClear();
    db.delete.mockClear();
    db.transaction.mockClear();
    tx.select.mockClear();
    tx.update.mockClear();
    tx.insert.mockClear();
    tx.delete.mockClear();

    checkoutSessionsCreate.mockReset();
    promotionCodesList.mockReset();
    promotionCodesRetrieve.mockReset();
    refundsCreate.mockReset();
    webhooksConstructEvent.mockReset();
    StripeMock.mockClear();
  };

  return {
    StripeMock,
    db,
    reset,
    testUserId,
    txDeleteReturningQueue,
    txDeleteWhereCalls,
    txInsertAwaitQueue,
    txInsertCalls,
    txInsertReturningQueue,
    txOperationLog,
    txSelectArgs,
    txSelectForUpdateCalls,
    txSelectForUpdateQueue,
    txSelectFromCalls,
    txSelectLimitCalls,
    txSelectLimitQueue,
    txSelectOrderByCalls,
    txSelectWhereCalls,
    txUpdateAwaitQueue,
    txUpdateReturningQueue,
    txUpdateSetCalls,
    txUpdateWhereCalls,
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

const ADDRESS_ID_1 = '22222222-2222-4222-8222-222222222222';
const ADDRESS_ID_2 = '33333333-3333-4333-8333-333333333333';

const BASE_ADDRESS = {
  label: 'Home',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  street: '1 Main St',
  city: 'Melbourne',
  state: 'VIC',
  zipcode: '3000',
  country: 'Australia',
  phone: '+61400000000',
};

const buildAddressBody = (overrides: Record<string, unknown> = {}) => ({
  ...BASE_ADDRESS,
  isDefault: false,
  ...overrides,
});

const requestJson = (method: 'POST' | 'DELETE', path: string, body: unknown) => {
  return app.request(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

beforeEach(() => {
  mockState.reset();
});

describe('Address safety', () => {
  it('A1 saveAddress uses FOR UPDATE before clearing old defaults', async () => {
    const created = {
      id: ADDRESS_ID_1,
      userId: mockState.testUserId,
      ...buildAddressBody({ isDefault: true }),
    };

    mockState.txSelectForUpdateQueue.push([{ id: ADDRESS_ID_2 }]);
    mockState.txInsertReturningQueue.push([created]);

    const res = await requestJson('POST', '/api/user/addresses', buildAddressBody({ isDefault: true }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ success: true, data: created });
    expect(mockState.db.transaction).toHaveBeenCalledTimes(1);
    expect(mockState.txSelectForUpdateCalls).toEqual(['update']);
    expect(mockState.txUpdateSetCalls[0]).toEqual({ isDefault: false });
    expect(mockState.txInsertCalls[0]).toEqual({
      ...BASE_ADDRESS,
      isDefault: true,
      userId: mockState.testUserId,
    });

    const lockIndex = mockState.txOperationLog.indexOf('select.for:update');
    const clearDefaultsIndex = mockState.txOperationLog.indexOf('update.set:clear-defaults');

    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(clearDefaultsIndex).toBeGreaterThan(lockIndex);
  });

  it('A2 saveAddress does not lock rows when isDefault is false', async () => {
    const created = {
      id: ADDRESS_ID_1,
      userId: mockState.testUserId,
      ...buildAddressBody({ label: 'Office' }),
    };

    mockState.txInsertReturningQueue.push([created]);

    const res = await requestJson('POST', '/api/user/addresses', buildAddressBody({ label: 'Office' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ success: true, data: created });
    expect(mockState.txSelectForUpdateCalls).toHaveLength(0);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
    expect(mockState.txInsertCalls[0]).toEqual({
      ...BASE_ADDRESS,
      label: 'Office',
      isDefault: false,
      userId: mockState.testUserId,
    });
  });

  it('A3 saveAddress updates an owned address after ownership check', async () => {
    const updated = {
      id: ADDRESS_ID_1,
      userId: mockState.testUserId,
      ...buildAddressBody({ label: 'Work', city: 'Sydney' }),
    };

    mockState.txSelectLimitQueue.push([{ id: ADDRESS_ID_1 }]);
    mockState.txUpdateReturningQueue.push([updated]);

    const res = await requestJson('POST', '/api/user/addresses', {
      id: ADDRESS_ID_1,
      ...buildAddressBody({ label: 'Work', city: 'Sydney' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: updated });
    expect(mockState.txSelectLimitCalls).toEqual([1]);
    expect(mockState.txUpdateSetCalls[0]).toMatchObject({
      label: 'Work',
      city: 'Sydney',
      isDefault: false,
    });
    expect(mockState.txInsertCalls).toHaveLength(0);
  });

  it('A4 saveAddress returns 404 when the address is not owned by the user', async () => {
    mockState.txSelectLimitQueue.push([]);

    const res = await requestJson('POST', '/api/user/addresses', {
      id: ADDRESS_ID_1,
      ...buildAddressBody({ label: 'Work' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ success: false, message: 'Address not found' });
    expect(mockState.txSelectLimitCalls).toEqual([1]);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
    expect(mockState.txInsertCalls).toHaveLength(0);
  });

  it('A5 deleteAddress promotes the next most recent address after deleting the default', async () => {
    mockState.txDeleteReturningQueue.push([{ id: ADDRESS_ID_1, isDefault: true }]);
    mockState.txSelectLimitQueue.push([{ id: ADDRESS_ID_2 }]);

    const res = await requestJson('DELETE', '/api/user/addresses', { addressId: ADDRESS_ID_1 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Address deleted',
      promotedDefaultId: ADDRESS_ID_2,
    });
    expect(mockState.txSelectOrderByCalls).toHaveLength(1);
    expect(mockState.txSelectLimitCalls).toEqual([1]);
    expect(mockState.txUpdateSetCalls).toEqual([{ isDefault: true }]);
    expect(mockState.txUpdateWhereCalls).toHaveLength(1);
  });

  it('A6 deleteAddress does not promote another address when deleting a non-default address', async () => {
    mockState.txDeleteReturningQueue.push([{ id: ADDRESS_ID_1, isDefault: false }]);

    const res = await requestJson('DELETE', '/api/user/addresses', { addressId: ADDRESS_ID_1 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Address deleted',
      promotedDefaultId: null,
    });
    expect(mockState.txSelectOrderByCalls).toHaveLength(0);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
  });

  it('A7 deleteAddress does not promote when the deleted default was the only remaining address', async () => {
    mockState.txDeleteReturningQueue.push([{ id: ADDRESS_ID_1, isDefault: true }]);
    mockState.txSelectLimitQueue.push([]);

    const res = await requestJson('DELETE', '/api/user/addresses', { addressId: ADDRESS_ID_1 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Address deleted',
      promotedDefaultId: null,
    });
    expect(mockState.txSelectOrderByCalls).toHaveLength(1);
    expect(mockState.txSelectLimitCalls).toEqual([1]);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
  });

  it('A8 deleteAddress returns 404 when no address is deleted', async () => {
    mockState.txDeleteReturningQueue.push([]);

    const res = await requestJson('DELETE', '/api/user/addresses', { addressId: ADDRESS_ID_1 });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ success: false, message: 'Address not found' });
    expect(mockState.txSelectOrderByCalls).toHaveLength(0);
    expect(mockState.txUpdateSetCalls).toHaveLength(0);
  });
});
