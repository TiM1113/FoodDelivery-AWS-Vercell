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
	index,
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
	kycStatus: varchar('kyc_status', { length: 20 }).notNull().default('unverified'),
	kycSessionId: varchar('kyc_session_id', { length: 255 }),
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
	stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
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

// ── Addresses ────────────────────────────────────────────────
export const addresses = pgTable('addresses', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	label: varchar('label', { length: 50 }).notNull().default('Home'),
	firstName: varchar('first_name', { length: 50 }).notNull(),
	lastName: varchar('last_name', { length: 50 }).notNull(),
	email: varchar('email', { length: 255 }).notNull(),
	street: varchar('street', { length: 200 }).notNull(),
	city: varchar('city', { length: 100 }).notNull(),
	state: varchar('state', { length: 100 }).notNull(),
	zipcode: varchar('zipcode', { length: 20 }).notNull(),
	country: varchar('country', { length: 100 }).notNull(),
	phone: varchar('phone', { length: 30 }).notNull(),
	isDefault: boolean('is_default').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── KYC Audit Logs ──────────────────────────────────────────
// Audit rows are retained even if the user is deleted (no cascade).
export const kycAuditLogs = pgTable('kyc_audit_logs', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id),
	previousStatus: varchar('previous_status', { length: 20 }).notNull(),
	newStatus: varchar('new_status', { length: 20 }).notNull(),
	trigger: varchar('trigger', { length: 30 }).notNull(),
	stripeSessionId: varchar('stripe_session_id', { length: 255 }),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
	index('kyc_audit_user_created_idx').on(table.userId, table.createdAt),
]);

// ── Relations ────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
	orders: many(orders),
	addresses: many(addresses),
	kycAuditLogs: many(kycAuditLogs),
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

export const addressesRelations = relations(addresses, ({ one }) => ({
	user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const kycAuditLogsRelations = relations(kycAuditLogs, ({ one }) => ({
	user: one(users, { fields: [kycAuditLogs.userId], references: [users.id] }),
}));
