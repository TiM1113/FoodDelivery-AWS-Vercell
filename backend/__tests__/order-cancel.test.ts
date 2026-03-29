import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const updateSetCalls: Array<Record<string, unknown>> = [];
  const updateWhereCalls: unknown[] = [];
  const selectArgs: unknown[] = [];
  const updateReturningQueue: unknown[][] = [];
  const updateAwaitQueue: unknown[] = [];
  const selectLimitQueue: unknown[][] = [];

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
          create: vi.fn(),
        },
      },
      promotionCodes: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      identity: {
        verificationSessions: {
          create: vi.fn(),
          retrieve: vi.fn(),
        },
      },
    };
  });

  const createThenable = (result: unknown, extras: Record<string, unknown> = {}) => ({
    ...extras,
    then(onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
    catch(onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(result).catch(onRejected);
    },
    finally(onFinally?: () => void) {
      return Promise.resolve(result).finally(onFinally);
    },
  });

  const db = {
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        updateSetCalls.push(values);

        return {
          where: vi.fn((condition: unknown) => {
            updateWhereCalls.push(condition);

            return createThenable(updateAwaitQueue.shift() ?? [], {
              returning: vi.fn(async () => updateReturningQueue.shift() ?? []),
            });
          }),
        };
      }),
    })),
    select: vi.fn((fields?: unknown) => {
      selectArgs.push(fields);

      return {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => selectLimitQueue.shift() ?? []),
          })),
        })),
      };
    }),
  };

  const reset = () => {
    updateSetCalls.length = 0;
    updateWhereCalls.length = 0;
    selectArgs.length = 0;
    updateReturningQueue.length = 0;
    updateAwaitQueue.length = 0;
    selectLimitQueue.length = 0;

    db.update.mockClear();
    db.select.mockClear();
    refundsCreate.mockReset();
    webhooksConstructEvent.mockReset();
    StripeMock.mockClear();
  };

  return {
    StripeMock,
    db,
    refundsCreate,
    reset,
    selectArgs,
    selectLimitQueue,
    updateAwaitQueue,
    updateReturningQueue,
    updateSetCalls,
    updateWhereCalls,
    webhooksConstructEvent,
  };
});

vi.mock('../db', () => ({
  db: mockState.db,
}));

vi.mock('stripe', () => ({
  default: mockState.StripeMock,
}));

import app from '../app';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const TEST_ORDER_ID = '22222222-2222-4222-8222-222222222222';

const authCookie = (userId = TEST_USER_ID) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!);
  return `token=${token}`;
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

const paidOrder = {
  id: TEST_ORDER_ID,
  userId: TEST_USER_ID,
  status: 'Cancelled',
  payment: true,
  stripePaymentIntentId: 'pi_test123',
};

const unpaidOrder = {
  id: TEST_ORDER_ID,
  userId: TEST_USER_ID,
  status: 'Cancelled',
  payment: false,
  stripePaymentIntentId: null,
};

beforeEach(() => {
  mockState.reset();
});

describe('Order cancel safety', () => {
  it('returns 400 when orderId is missing', async () => {
    const res = await postJson('/api/order/cancel', {}, { Cookie: authCookie() });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ success: false, message: 'Order ID is required' });
  });

  it('cancels an unpaid order atomically without refund', async () => {
    mockState.updateReturningQueue.push([unpaidOrder]);

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ success: true, message: 'Order cancelled' }));
    expect(mockState.refundsCreate).not.toHaveBeenCalled();
  });

  it('cancels a paid order and starts a refund', async () => {
    mockState.updateReturningQueue.push([
      {
        ...paidOrder,
        stripePaymentIntentId: 'pi_test123',
      },
    ]);
    mockState.refundsCreate.mockResolvedValue({ id: 're_test456' });

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Order cancelled and refund initiated',
      refundId: 're_test456',
    });
    expect(mockState.refundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test123' });
  });

  it('returns 400 when the order was already cancelled by another request', async () => {
    mockState.updateReturningQueue.push([]);
    mockState.selectLimitQueue.push([{ id: TEST_ORDER_ID, status: 'Cancelled' }]);

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Cannot cancel order with status "Cancelled"');
  });

  it('returns 404 when the order does not exist', async () => {
    mockState.updateReturningQueue.push([]);
    mockState.selectLimitQueue.push([]);

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ success: false, message: 'Order not found' });
  });

  it('returns 400 for non-cancellable statuses', async () => {
    mockState.updateReturningQueue.push([]);
    mockState.selectLimitQueue.push([{ id: TEST_ORDER_ID, status: 'Delivered' }]);

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Cannot cancel order with status "Delivered"');
  });

  it('rolls back status when refund fails', async () => {
    mockState.updateReturningQueue.push([
      {
        ...paidOrder,
        stripePaymentIntentId: 'pi_test789',
      },
    ]);
    mockState.refundsCreate.mockRejectedValue(new Error('Stripe down'));

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.message).toContain('Refund failed');
    expect(mockState.updateSetCalls[1]).toEqual({ status: 'Food Processing' });
  });

  it('cancels a paid legacy order without refund when no payment intent exists', async () => {
    mockState.updateReturningQueue.push([
      {
        ...paidOrder,
        stripePaymentIntentId: null,
      },
    ]);

    const res = await postJson(
      '/api/order/cancel',
      { orderId: TEST_ORDER_ID },
      { Cookie: authCookie() },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(expect.objectContaining({ success: true }));
    expect(mockState.refundsCreate).not.toHaveBeenCalled();
  });
});

describe('Order webhook payment intent capture', () => {
  it('stores a string payment intent ID from checkout.session.completed', async () => {
    mockState.webhooksConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { orderId: TEST_ORDER_ID },
          payment_intent: 'pi_webhook_test',
        },
      },
    });

    const res = await postJson(
      '/api/order/webhook',
      { id: 'evt_test_1' },
      { 'stripe-signature': 'sig_test' },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockState.updateSetCalls[0]).toEqual({
      payment: true,
      status: 'Food Processing',
      stripePaymentIntentId: 'pi_webhook_test',
    });
  });

  it('stores the payment intent ID when Stripe sends an object', async () => {
    mockState.webhooksConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { orderId: TEST_ORDER_ID },
          payment_intent: { id: 'pi_object_test' },
        },
      },
    });

    const res = await postJson(
      '/api/order/webhook',
      { id: 'evt_test_2' },
      { 'stripe-signature': 'sig_test' },
    );

    expect(res.status).toBe(200);
    expect(mockState.updateSetCalls[0]).toEqual({
      payment: true,
      status: 'Food Processing',
      stripePaymentIntentId: 'pi_object_test',
    });
  });

  it('stores null when Stripe sends a null payment intent', async () => {
    mockState.webhooksConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { orderId: TEST_ORDER_ID },
          payment_intent: null,
        },
      },
    });

    const res = await postJson(
      '/api/order/webhook',
      { id: 'evt_test_3' },
      { 'stripe-signature': 'sig_test' },
    );

    expect(res.status).toBe(200);
    expect(mockState.updateSetCalls[0]).toEqual({
      payment: true,
      status: 'Food Processing',
      stripePaymentIntentId: null,
    });
  });
});
