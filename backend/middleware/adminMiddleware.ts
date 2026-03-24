import { MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { AppEnv } from '../types';

const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const userId = c.get('userId');
	if (!userId) {
		return c.json({ success: false, message: 'Not Authorized' }, 401);
	}
	try {
		const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
		if (!user || user.role !== 'admin') {
			return c.json({ success: false, message: 'Admin access required' }, 403);
		}
		await next();
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error' }, 500);
	}
};

export default adminMiddleware;
