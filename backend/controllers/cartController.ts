import { Context } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { AppEnv } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const addToCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { itemId } = await c.req.json();

		if (!itemId || typeof itemId !== 'string' || !UUID_RE.test(itemId)) {
			return c.json({ success: false, message: 'Invalid item ID' }, 400);
		}

		// Atomic jsonb update: increment quantity or set to 1 if key doesn't exist
		const result = await db.update(users).set({
			cartData: sql`jsonb_set(
				COALESCE(${users.cartData}, '{}'::jsonb),
				${sql.raw(`'{${itemId}}'`)},
				(COALESCE(${users.cartData}->>${sql.raw(`'${itemId}'`)}, '0')::int + 1)::text::jsonb
			)`,
		}).where(eq(users.id, userId)).returning({ id: users.id });

		if (result.length === 0) return c.json({ success: false, message: 'User not found' }, 404);

		return c.json({ success: true, message: 'Added To Cart' });
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const removeFromCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { itemId } = await c.req.json();

		if (!itemId || typeof itemId !== 'string' || !UUID_RE.test(itemId)) {
			return c.json({ success: false, message: 'Invalid item ID' }, 400);
		}

		// Read current quantity — decide between decrement and no-op
		const [userData] = await db.select({ cartData: users.cartData }).from(users).where(eq(users.id, userId)).limit(1);
		if (!userData) return c.json({ success: false, message: 'User not found' }, 404);

		const currentQty = (userData.cartData || {})[itemId] || 0;
		if (currentQty <= 0) {
			return c.json({ success: true, message: 'Removed From Cart' });
		}

		// Atomic decrement
		await db.update(users).set({
			cartData: sql`jsonb_set(
				COALESCE(${users.cartData}, '{}'::jsonb),
				${sql.raw(`'{${itemId}}'`)},
				(COALESCE(${users.cartData}->>${sql.raw(`'${itemId}'`)}, '0')::int - 1)::text::jsonb
			)`,
		}).where(eq(users.id, userId));

		return c.json({ success: true, message: 'Removed From Cart' });
	} catch (error) {
		console.error(error);
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
		console.error(error);
		return c.json({ success: false, message: 'Error' });
	}
};
