/**
 * One-time migration script: MongoDB → PostgreSQL (Neon)
 *
 * Usage:
 *   DATABASE_URL=postgresql://... MONGODB_URI=mongodb+srv://... npx tsx db/migrate-from-mongo.ts
 *
 * Prerequisites:
 *   - PostgreSQL tables must exist (run `pnpm db:push` first)
 *   - Both DATABASE_URL and MONGODB_URI must be set
 *   - Install mongoose temporarily: pnpm add mongoose (remove after migration)
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

async function migrate() {
	// Dynamic import mongoose (may need temporary install)
	const mongoose = await import('mongoose');

	const mongoUri = process.env.MONGODB_URI;
	const pgUrl = process.env.DATABASE_URL;

	if (!mongoUri || !pgUrl) {
		console.error('Both MONGODB_URI and DATABASE_URL must be set');
		process.exit(1);
	}

	// Connect to both databases
	console.log('Connecting to MongoDB...');
	await mongoose.default.connect(mongoUri);
	console.log('MongoDB connected');

	const sql = neon(pgUrl);
	const db = drizzle(sql, { schema });
	console.log('PostgreSQL connected');

	// ID mapping tables
	const userIdMap = new Map<string, string>(); // mongo _id → pg uuid
	const foodIdMap = new Map<string, string>();

	// ── Migrate Users ──────────────────────────────────────────
	console.log('\n--- Migrating Users ---');
	const UserModel = mongoose.default.models.user || mongoose.default.model('user', new mongoose.Schema({
		name: String,
		email: String,
		password: String,
		cartData: Object,
		role: { type: String, default: 'user' },
	}, { minimize: false }));

	const mongoUsers = await UserModel.find({});
	console.log(`Found ${mongoUsers.length} users`);

	for (const mongoUser of mongoUsers) {
		const [pgUser] = await db.insert(schema.users).values({
			name: mongoUser.name,
			email: mongoUser.email,
			password: mongoUser.password,
			cartData: {}, // will remap later
			role: mongoUser.role || 'user',
		}).returning();

		userIdMap.set(mongoUser._id.toString(), pgUser.id);
		console.log(`  User: ${mongoUser.email} → ${pgUser.id}`);
	}

	// ── Migrate Foods ──────────────────────────────────────────
	console.log('\n--- Migrating Foods ---');
	const FoodModel = mongoose.default.models.foods || mongoose.default.model('foods', new mongoose.Schema({
		name: String,
		description: String,
		price: Number,
		image: String,
		category: String,
	}, { collection: 'foods', versionKey: false }));

	const mongoFoods = await FoodModel.find({});
	console.log(`Found ${mongoFoods.length} foods`);

	for (const mongoFood of mongoFoods) {
		const [pgFood] = await db.insert(schema.foods).values({
			name: mongoFood.name,
			description: mongoFood.description,
			price: mongoFood.price,
			image: mongoFood.image,
			category: mongoFood.category,
		}).returning();

		foodIdMap.set(mongoFood._id.toString(), pgFood.id);
		console.log(`  Food: ${mongoFood.name} → ${pgFood.id}`);
	}

	// ── Remap Cart Data ────────────────────────────────────────
	console.log('\n--- Remapping Cart Data ---');
	for (const mongoUser of mongoUsers) {
		const mongoCartData = mongoUser.cartData || {};
		const pgCartData: Record<string, number> = {};
		let remapped = 0;

		for (const [oldFoodId, quantity] of Object.entries(mongoCartData)) {
			const newFoodId = foodIdMap.get(oldFoodId);
			if (newFoodId && typeof quantity === 'number' && quantity > 0) {
				pgCartData[newFoodId] = quantity;
				remapped++;
			}
		}

		if (remapped > 0) {
			const pgUserId = userIdMap.get(mongoUser._id.toString())!;
			await db.update(schema.users).set({ cartData: pgCartData })
				.where(eq(schema.users.id, pgUserId));
			console.log(`  Cart for ${mongoUser.email}: ${remapped} items remapped`);
		}
	}

	// ── Migrate Orders ─────────────────────────────────────────
	console.log('\n--- Migrating Orders ---');
	const OrderModel = mongoose.default.models.order || mongoose.default.model('order', new mongoose.Schema({
		userId: String,
		items: [mongoose.Schema.Types.Mixed],
		amount: Number,
		address: Object,
		status: String,
		date: Date,
		payment: Boolean,
	}));

	const mongoOrders = await OrderModel.find({});
	console.log(`Found ${mongoOrders.length} orders`);

	let ordersSkipped = 0;
	for (const mongoOrder of mongoOrders) {
		const pgUserId = userIdMap.get(mongoOrder.userId);
		if (!pgUserId) {
			console.warn(`  Skipping order ${mongoOrder._id}: user ${mongoOrder.userId} not found`);
			ordersSkipped++;
			continue;
		}

		const [pgOrder] = await db.insert(schema.orders).values({
			userId: pgUserId,
			amount: mongoOrder.amount,
			address: mongoOrder.address,
			status: mongoOrder.status || 'Payment Pending',
			payment: mongoOrder.payment || false,
			createdAt: mongoOrder.date || new Date(),
		}).returning();

		// Migrate order items
		const orderItemValues = (mongoOrder.items || []).map((item: {
			_id?: string;
			name?: string;
			price?: number;
			quantity?: number;
		}) => {
			const oldFoodId = item._id?.toString();
			const pgFoodId = oldFoodId ? foodIdMap.get(oldFoodId) : null;

			return {
				orderId: pgOrder.id,
				foodId: pgFoodId || null,
				name: item.name || 'Unknown Item',
				price: item.price || 0,
				quantity: item.quantity || 1,
			};
		});

		if (orderItemValues.length > 0) {
			await db.insert(schema.orderItems).values(orderItemValues);
		}

		console.log(`  Order: ${mongoOrder._id} → ${pgOrder.id} (${orderItemValues.length} items)`);
	}

	// ── Summary ────────────────────────────────────────────────
	console.log('\n=== Migration Summary ===');
	console.log(`Users:  ${mongoUsers.length} migrated`);
	console.log(`Foods:  ${mongoFoods.length} migrated`);
	console.log(`Orders: ${mongoOrders.length - ordersSkipped} migrated, ${ordersSkipped} skipped`);
	console.log('\nMigration complete! Verify data in Drizzle Studio: pnpm db:studio');

	await mongoose.default.disconnect();
	process.exit(0);
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
