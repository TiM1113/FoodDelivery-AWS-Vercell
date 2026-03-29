/**
 * @generated Codex (gpt-5.4) — 2026-03-29
 * @spec backend/__tests__/TEST-SPEC.md (Phase 5 Step 2: Pagination and List Query Fixes)
 */

import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type FoodRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  createdAt: Date;
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

const mockState = vi.hoisted(() => {
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_BUCKET_NAME = 'test-bucket';
  process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';

  const selectArgs: unknown[] = [];
  const whereCalls: unknown[] = [];
  const orderByCalls: unknown[][] = [];
  const limitCalls: number[] = [];
  const limitQueue: unknown[][] = [];

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

  const createSelectBuilder = () => {
    const builder = {
      where: vi.fn((condition: unknown) => {
        whereCalls.push(condition);
        return builder;
      }),
      orderBy: vi.fn((...clauses: unknown[]) => {
        orderByCalls.push(clauses);
        return builder;
      }),
      limit: vi.fn(async (value: number) => {
        limitCalls.push(value);
        return limitQueue.shift() ?? [];
      }),
    };

    return builder;
  };

  const db = {
    select: vi.fn((fields?: unknown) => {
      selectArgs.push(fields);

      return {
        from: vi.fn(() => createSelectBuilder()),
      };
    }),
  };

  const reset = () => {
    selectArgs.length = 0;
    whereCalls.length = 0;
    orderByCalls.length = 0;
    limitCalls.length = 0;
    limitQueue.length = 0;

    db.select.mockClear();
    StripeMock.mockClear();
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
    limitCalls,
    limitQueue,
    orderByCalls,
    reset,
    selectArgs,
    whereCalls,
  };
});

vi.mock('../db', () => ({
  db: mockState.db,
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

const foodId = (index: number) => `${String(index).padStart(8, '0')}-0000-4000-8000-${String(index).padStart(12, '0')}`;

const makeFood = (index: number, overrides: Partial<FoodRow> = {}): FoodRow => ({
  id: foodId(index),
  name: `Food ${index}`,
  description: `Description ${index}`,
  price: index,
  image: `image-${index}.jpg`,
  category: 'Main',
  createdAt: new Date(Date.UTC(2026, 2, 29, 12, 0, index)),
  ...overrides,
});

const decodeCursor = (cursor: string) =>
  JSON.parse(Buffer.from(cursor, 'base64url').toString()) as { value: string; id: string };

const renderSql = (expression: unknown) => dialect.sqlToQuery(expression as never);

const getJson = async (path: string) => {
  const res = await app.request(path);
  const body = await res.json();

  return { body, res };
};

beforeEach(() => {
  mockState.reset();
});

describe('Food list pagination and list query fixes', () => {
  it('returns the first page with a createdAt cursor for the default sort', async () => {
    const rows = Array.from({ length: DEFAULT_PAGE_SIZE + 1 }, (_, index) =>
      makeFood(index + 1, {
        createdAt: new Date(Date.UTC(2026, 2, 29, 12, 0, DEFAULT_PAGE_SIZE + 1 - index)),
      }),
    );
    mockState.limitQueue.push(rows);

    const { res, body } = await getJson('/api/food/list');
    const expectedLastItem = rows[DEFAULT_PAGE_SIZE - 1];

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      count: DEFAULT_PAGE_SIZE,
      data: expect.arrayContaining([
        expect.objectContaining({ _id: rows[0].id }),
        expect.objectContaining({ _id: expectedLastItem.id }),
      ]),
    });
    expect(mockState.whereCalls).toHaveLength(0);
    expect(mockState.orderByCalls[0]).toHaveLength(2);
    expect(renderSql(mockState.orderByCalls[0][0]).sql).toBe('"foods"."created_at" desc');
    expect(renderSql(mockState.orderByCalls[0][1]).sql).toBe('"foods"."id" asc');
    expect(decodeCursor(body.nextCursor)).toEqual({
      value: expectedLastItem.createdAt.toISOString(),
      id: expectedLastItem.id,
    });
  });

  it('returns the first page with a price cursor for price_asc sort', async () => {
    const rows = Array.from({ length: DEFAULT_PAGE_SIZE + 1 }, (_, index) =>
      makeFood(index + 1, {
        price: index + 1 === DEFAULT_PAGE_SIZE ? 12.5 : index + 1,
      }),
    );
    mockState.limitQueue.push(rows);

    const { res, body } = await getJson('/api/food/list?sortBy=price_asc');
    const expectedLastItem = rows[DEFAULT_PAGE_SIZE - 1];

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      count: DEFAULT_PAGE_SIZE,
    });
    expect(mockState.orderByCalls[0]).toHaveLength(2);
    expect(renderSql(mockState.orderByCalls[0][0]).sql).toBe('"foods"."price" asc');
    expect(renderSql(mockState.orderByCalls[0][1]).sql).toBe('"foods"."id" asc');
    expect(decodeCursor(body.nextCursor)).toEqual({
      value: '12.5',
      id: expectedLastItem.id,
    });
  });

  it('decodes a price_asc cursor into the expected compound WHERE clause', async () => {
    const cursorId = foodId(99);
    const cursor = Buffer.from(JSON.stringify({ value: '12.5', id: cursorId })).toString('base64url');
    mockState.limitQueue.push([]);

    const { res } = await getJson(`/api/food/list?sortBy=price_asc&cursor=${cursor}`);
    const whereQuery = renderSql(mockState.whereCalls[0]);

    expect(res.status).toBe(200);
    expect(whereQuery.sql).toBe('(("foods"."price" = $1 and "foods"."id" > $2) or "foods"."price" > $3)');
    expect(whereQuery.params).toEqual([12.5, cursorId, 12.5]);
  });

  it('decodes a price_desc cursor into the expected compound WHERE clause', async () => {
    const cursorId = foodId(98);
    const cursor = Buffer.from(JSON.stringify({ value: '12.5', id: cursorId })).toString('base64url');
    mockState.limitQueue.push([]);

    const { res } = await getJson(`/api/food/list?sortBy=price_desc&cursor=${cursor}`);
    const whereQuery = renderSql(mockState.whereCalls[0]);

    expect(res.status).toBe(200);
    expect(whereQuery.sql).toBe('(("foods"."price" = $1 and "foods"."id" > $2) or "foods"."price" < $3)');
    expect(whereQuery.params).toEqual([12.5, cursorId, 12.5]);
  });

  it('decodes a name_asc cursor into the expected compound WHERE clause', async () => {
    const cursorId = foodId(97);
    const cursorValue = 'Caesar Salad';
    const cursor = Buffer.from(JSON.stringify({ value: cursorValue, id: cursorId })).toString('base64url');
    mockState.limitQueue.push([]);

    const { res } = await getJson(`/api/food/list?sortBy=name_asc&cursor=${cursor}`);
    const whereQuery = renderSql(mockState.whereCalls[0]);

    expect(res.status).toBe(200);
    expect(whereQuery.sql).toBe('(("foods"."name" = $1 and "foods"."id" > $2) or "foods"."name" > $3)');
    expect(whereQuery.params).toEqual([cursorValue, cursorId, cursorValue]);
  });

  it('decodes a default cursor into the expected newest-first WHERE clause', async () => {
    const cursorId = foodId(96);
    const cursorDate = '2026-03-01T00:00:00.000Z';
    const cursor = Buffer.from(JSON.stringify({ value: cursorDate, id: cursorId })).toString('base64url');
    mockState.limitQueue.push([]);

    const { res } = await getJson(`/api/food/list?cursor=${cursor}`);
    const whereQuery = renderSql(mockState.whereCalls[0]);

    expect(res.status).toBe(200);
    expect(whereQuery.sql).toBe('(("foods"."created_at" = $1 and "foods"."id" > $2) or "foods"."created_at" < $3)');
    expect(whereQuery.params).toEqual([cursorDate, cursorId, cursorDate]);
  });

  it('falls back to the first page when the cursor is invalid base64', async () => {
    const rows = Array.from({ length: DEFAULT_PAGE_SIZE + 1 }, (_, index) => makeFood(index + 1));
    mockState.limitQueue.push(rows);

    const { res, body } = await getJson('/api/food/list?cursor=not-valid-base64');

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, count: DEFAULT_PAGE_SIZE });
    expect(mockState.whereCalls).toHaveLength(0);
  });

  it('treats an empty cursor string as no cursor', async () => {
    const rows = Array.from({ length: DEFAULT_PAGE_SIZE + 1 }, (_, index) => makeFood(index + 1));
    mockState.limitQueue.push(rows);

    const { res, body } = await getJson('/api/food/list?cursor=');

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, count: DEFAULT_PAGE_SIZE });
    expect(mockState.whereCalls).toHaveLength(0);
  });

  it('uses the id tiebreaker when sorting duplicate prices', async () => {
    const rows = [
      makeFood(1, { price: 12 }),
      makeFood(2, { price: 12 }),
      makeFood(3, { price: 12 }),
    ];
    mockState.limitQueue.push(rows);

    const { res } = await getJson('/api/food/list?sortBy=price_asc&limit=3');

    expect(res.status).toBe(200);
    expect(mockState.orderByCalls[0]).toHaveLength(2);
    expect(renderSql(mockState.orderByCalls[0][0]).sql).toBe('"foods"."price" asc');
    expect(renderSql(mockState.orderByCalls[0][1]).sql).toBe('"foods"."id" asc');
  });

  it('returns nextCursor as null when the result size is at most the requested limit', async () => {
    const rows = [makeFood(1), makeFood(2), makeFood(3)];
    mockState.limitQueue.push(rows);

    const { res, body } = await getJson('/api/food/list?limit=3');

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      count: 3,
      nextCursor: null,
    });
  });

  it('returns only limit items and a nextCursor when more data exists', async () => {
    const rows = [makeFood(1), makeFood(2), makeFood(3), makeFood(4)];
    mockState.limitQueue.push(rows);

    const { res, body } = await getJson('/api/food/list?limit=3');

    expect(res.status).toBe(200);
    expect(body.count).toBe(3);
    expect(body.data).toHaveLength(3);
    expect(body.nextCursor).toEqual(expect.any(String));
  });

  it('clamps limit=0 to 1 item', async () => {
    mockState.limitQueue.push([makeFood(1), makeFood(2)]);

    const { res } = await getJson('/api/food/list?limit=0');

    expect(res.status).toBe(200);
    expect(mockState.limitCalls[0]).toBe(2);
  });

  it('clamps a very large limit to the max page size', async () => {
    mockState.limitQueue.push([]);

    const { res } = await getJson('/api/food/list?limit=999');

    expect(res.status).toBe(200);
    expect(mockState.limitCalls[0]).toBe(MAX_PAGE_SIZE + 1);
  });

  it('defaults a non-numeric limit to the default page size', async () => {
    mockState.limitQueue.push([]);

    const { res } = await getJson('/api/food/list?limit=abc');

    expect(res.status).toBe(200);
    expect(mockState.limitCalls[0]).toBe(DEFAULT_PAGE_SIZE + 1);
  });
});
