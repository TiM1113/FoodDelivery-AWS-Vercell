/**
 * @generated Codex (gpt-5.4) — 2026-03-29
 * @spec backend/__tests__/TEST-SPEC.md (Phase 5 Step 4: Promo & Payment Integrity)
 */

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
  const updateReturningQueue: unknown[][] = [];

  const txInsertCalls: unknown[] = [];
  const txInsertAwaitQueue: unknown[] = [];
  const txInsertReturningQueue: unknown[][] = [];
  const txUpdateSetCalls: Array<Record<string, unknown>> = [];
  const txUpdateWhereCalls: unknown[] = [];
  const txUpdateAwaitQueue: unknown[] = [];
  const txUpdateReturningQueue: unknown[][] = [];

  const checkoutSessionsCreate = vi.fn().mockResolvedValue({
    id: 'cs_test_default',
    url: 'https://checkout.stripe.test/session',
  });
  const promotionCodesList = vi.fn().mockResolvedValue({ data: [] });
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

  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn((values: unknown) => {
        txInsertCalls.push(values);

        return createQueuedThenable(txInsertAwaitQueue, [], {
          returning: vi.fn(async () => txInsertReturningQueue.shift() ?? []),
        });
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        txUpdateSetCalls.push(values);

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
  };

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
    transaction: vi.fn(async (callback: (tx: any) => Promise<unknown> | unknown) => callback(tx)),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        updateSetCalls.push(values);

        return {
          where: vi.fn((condition: unknown) => {
            updateWhereCalls.push(condition);

            return createQueuedThenable(updateAwaitQueue, [], {
              returning: vi.fn(async () => updateReturningQueue.shift() ?? []),
            });
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
    updateReturningQueue.length = 0;

    txInsertCalls.length = 0;
    txInsertAwaitQueue.length = 0;
    txInsertReturningQueue.length = 0;
    txUpdateSetCalls.length = 0;
    txUpdateWhereCalls.length = 0;
    txUpdateAwaitQueue.length = 0;
    txUpdateReturningQueue.length = 0;

    db.select.mockClear();
    db.transaction.mockClear();
    db.update.mockClear();
    tx.insert.mockClear();
    tx.update.mockClear();

    checkoutSessionsCreate.mockReset();
    checkoutSessionsCreate.mockResolvedValue({
      id: 'cs_test_default',
      url: 'https://checkout.stripe.test/session',
    });
    promotionCodesList.mockReset();
    promotionCodesList.mockResolvedValue({ data: [] });
    promotionCodesRetrieve.mockReset();
    refundsCreate.mockReset();
    webhooksConstructEvent.mockReset();
    StripeMock.mockClear();
  };

  return {
    StripeMock,
    checkoutSessionsCreate,
    db,
    promotionCodesList,
    promotionCodesRetrieve,
    reset,
    selectArgs,
    selectFromCalls,
    selectLimitCalls,
    selectLimitQueue,
    selectWhereCalls,
    selectWhereQueue,
    testUserId,
    txInsertAwaitQueue,
    txInsertCalls,
    txInsertReturningQueue,
    txUpdateAwaitQueue,
    txUpdateReturningQueue,
    txUpdateSetCalls,
    txUpdateWhereCalls,
    updateAwaitQueue,
    updateReturningQueue,
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
const TEST_PROMO_ID = 'promo_abc123';
const TEST_FOOD = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'Burger',
  price: 15,
  description: 'A burger',
  image: 'img.jpg',
  category: 'Main',
  createdAt: new Date('2026-03-29T00:00:00.000Z'),
};
const TEST_ADDRESS = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'j@d.com',
  street: '1 Main St',
  city: 'Melbourne',
  state: 'VIC',
  zipcode: '3000',
  country: 'Australia',
  phone: '+61400000000',
};

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

const queueBasePlaceOrderMocks = () => {
  mockState.selectWhereQueue.push([TEST_FOOD]);
  mockState.selectLimitQueue.push([]);
  mockState.txInsertReturningQueue.push([{ id: TEST_ORDER_ID }]);
};

const buildPlaceOrderBody = (overrides: Record<string, unknown> = {}) => ({
  items: [{ _id: TEST_FOOD.id, quantity: 1 }],
  address: TEST_ADDRESS,
  amount: 17,
  ...overrides,
});

const buildPromo = ({
  active = true,
  amountOff = null,
  id = TEST_PROMO_ID,
  minimumAmount = null,
  percentOff = null,
}: {
  active?: boolean;
  amountOff?: number | null;
  id?: string;
  minimumAmount?: number | null;
  percentOff?: number | null;
}) => ({
  id,
  active,
  restrictions: {
    minimum_amount: minimumAmount,
  },
  coupon: {
    percent_off: percentOff,
    amount_off: amountOff,
    currency: 'aud',
    name: 'Promo',
  },
});

beforeEach(() => {
  mockState.reset();
});

describe('Promo validation minimum amount', () => {
  it('P1 returns minimumAmount when set', async () => {
    mockState.promotionCodesList.mockResolvedValue({
      data: [buildPromo({ minimumAmount: 5000, percentOff: 10 })],
    });

    const res = await postJson('/api/order/validate-promo', { code: 'save10' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      promoId: TEST_PROMO_ID,
      minimumAmount: 50,
      coupon: {
        percentOff: 10,
        amountOff: null,
        currency: 'aud',
        name: 'Promo',
      },
    });
  });

  it('P2 returns minimumAmount null when not set', async () => {
    mockState.promotionCodesList.mockResolvedValue({
      data: [buildPromo({ minimumAmount: null, percentOff: 15 })],
    });

    const res = await postJson('/api/order/validate-promo', { code: 'save15' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({
      success: true,
      promoId: TEST_PROMO_ID,
      minimumAmount: null,
      coupon: expect.objectContaining({
        percentOff: 15,
      }),
    }));
  });
});

describe('Promo re-validation and checkout integrity', () => {
  it('P3 rejects an inactive promo before checkout session creation', async () => {
    queueBasePlaceOrderMocks();
    mockState.promotionCodesRetrieve.mockResolvedValue(buildPromo({ active: false }));

    const res = await postJson('/api/order/place', buildPlaceOrderBody({ promoCode: TEST_PROMO_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('no longer active');
    expect(mockState.checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('P4 rejects a promo when the order total is below minimum amount', async () => {
    queueBasePlaceOrderMocks();
    mockState.promotionCodesRetrieve.mockResolvedValue(
      buildPromo({ active: true, minimumAmount: 5000, percentOff: 10 }),
    );

    const res = await postJson('/api/order/place', buildPlaceOrderBody({ promoCode: TEST_PROMO_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Minimum order amount');
    expect(mockState.checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('P5 stores percent discount promo info and passes idempotency key', async () => {
    queueBasePlaceOrderMocks();
    mockState.promotionCodesRetrieve.mockResolvedValue(
      buildPromo({ active: true, minimumAmount: null, percentOff: 20 }),
    );

    const res = await postJson('/api/order/place', buildPlaceOrderBody({ promoCode: TEST_PROMO_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      session_url: 'https://checkout.stripe.test/session',
    });

    expect(mockState.checkoutSessionsCreate).toHaveBeenCalledTimes(1);
    expect(mockState.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        discounts: [{ promotion_code: TEST_PROMO_ID }],
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^order_/),
      }),
    );
    expect(mockState.updateSetCalls[0]).toEqual({
      promoCode: TEST_PROMO_ID,
      discountAmount: 3.4,
    });
  });

  it('P6 still sends idempotency key without promo code', async () => {
    queueBasePlaceOrderMocks();

    const res = await postJson('/api/order/place', buildPlaceOrderBody());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      session_url: 'https://checkout.stripe.test/session',
    });

    expect(mockState.checkoutSessionsCreate).toHaveBeenCalledTimes(1);
    expect(mockState.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({ discounts: expect.anything() }),
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^order_/),
      }),
    );
    expect(mockState.promotionCodesRetrieve).not.toHaveBeenCalled();
    expect(mockState.updateSetCalls).toEqual([]);
  });

  it('P7 stores fixed amount discount correctly', async () => {
    queueBasePlaceOrderMocks();
    mockState.promotionCodesRetrieve.mockResolvedValue(
      buildPromo({ active: true, minimumAmount: null, amountOff: 500 }),
    );

    const res = await postJson('/api/order/place', buildPlaceOrderBody({ promoCode: TEST_PROMO_ID }));

    expect(res.status).toBe(200);
    expect(mockState.updateSetCalls[0]).toEqual({
      promoCode: TEST_PROMO_ID,
      discountAmount: 5,
    });
  });

  it('P8 caps fixed discount at the order amount', async () => {
    queueBasePlaceOrderMocks();
    mockState.promotionCodesRetrieve.mockResolvedValue(
      buildPromo({ active: true, minimumAmount: null, amountOff: 10000 }),
    );

    const res = await postJson('/api/order/place', buildPlaceOrderBody({ promoCode: TEST_PROMO_ID }));

    expect(res.status).toBe(200);
    expect(mockState.updateSetCalls[0]).toEqual({
      promoCode: TEST_PROMO_ID,
      discountAmount: 17,
    });
  });
});
