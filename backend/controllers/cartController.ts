import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { AppEnv } from '../types';

export const addToCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { itemId } = await c.req.json();
		const [userData] = await db.select({ cartData: users.cartData }).from(users).where(eq(users.id, userId)).limit(1);
		if (!userData) return c.json({ success: false, message: 'User not found' }, 404);

		const cartData = { ...(userData.cartData || {}) };
		if (!cartData[itemId]) {
			cartData[itemId] = 1;
		} else {
			cartData[itemId] += 1;
		}
		await db.update(users).set({ cartData }).where(eq(users.id, userId));
		return c.json({ success: true, message: 'Added To Cart' });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const removeFromCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { itemId } = await c.req.json();
		const [userData] = await db.select({ cartData: users.cartData }).from(users).where(eq(users.id, userId)).limit(1);
		if (!userData) return c.json({ success: false, message: 'User not found' }, 404);

		const cartData = { ...(userData.cartData || {}) };
		if (cartData[itemId] > 0) {
			cartData[itemId] -= 1;
		}
		await db.update(users).set({ cartData }).where(eq(users.id, userId));
		return c.json({ success: true, message: 'Removed From Cart' });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const getCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const [userData] = await db.select({ cartData: users.cartData }).from(users).where(eq(users.id, userId)).limit(1);
		if (!userData) return c.json({ success: false, message: 'User not found' }, 404);

		return c.json({ success: true, cartData: userData.cartData });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};
