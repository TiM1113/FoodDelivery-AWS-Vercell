import {
	pgTable,
	uuid,
	varchar,
	text,
	doublePrecision,
	boolean,
	integer,
	timestamp,
	jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Users ────────────────────────────────────────────────────
export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 50 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	password: varchar('password', { length: 255 }).notNull(),
	cartData: jsonb('cart_data').$type<Record<string, number>>().notNull().default({}),
	role: varchar('role', { length: 10 }).notNull().default('user'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Foods ────────────────────────────────────────────────────
export const foods = pgTable('foods', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description').notNull(),
	price: doublePrecision('price').notNull(),
	image: varchar('image', { length: 1024 }).notNull(),
	category: varchar('category', { length: 100 }).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Orders ───────────────────────────────────────────────────
export interface IAddress {
	firstName: string;
	lastName: string;
	email: string;
	street: string;
	city: string;
	state: string;
	zipcode: string;
	country: string;
	phone: string;
}

export const orders = pgTable('orders', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id),
	amount: doublePrecision('amount').notNull(),
	address: jsonb('address').$type<IAddress>().notNull(),
	status: varchar('status', { length: 50 }).notNull().default('Payment Pending'),
	payment: boolean('payment').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Order Items ──────────────────────────────────────────────
export const orderItems = pgTable('order_items', {
	id: uuid('id').defaultRandom().primaryKey(),
	orderId: uuid('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	foodId: uuid('food_id').references(() => foods.id, { onDelete: 'set null' }),
	name: varchar('name', { length: 255 }).notNull(),
	price: doublePrecision('price').notNull(),
	quantity: integer('quantity').notNull(),
});

// ── Relations ────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
	orders: many(orders),
}));

export const foodsRelations = relations(foods, ({ many }) => ({
	orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(users, { fields: [orders.userId], references: [users.id] }),
	items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
	food: one(foods, { fields: [orderItems.foodId], references: [foods.id] }),
}));
