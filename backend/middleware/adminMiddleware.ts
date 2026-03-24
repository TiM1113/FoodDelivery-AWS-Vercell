import { MiddlewareHandler } from 'hono';
import userModel from '../models/userModel';
import type { AppEnv } from '../types';

const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const userId = c.get('userId');
	if (!userId) {
		return c.json({ success: false, message: 'Not Authorized' }, 401);
	}
	try {
		const user = await userModel.findById(userId);
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
