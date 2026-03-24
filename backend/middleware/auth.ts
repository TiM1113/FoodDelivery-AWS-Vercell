import { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import type { AppEnv } from '../types';

const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const token = getCookie(c, 'token');
	if (!token) {
		return c.json({ success: false, message: 'Not Authorized Login Again' });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
		c.set('userId', decoded.id);
		await next();
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export default authMiddleware;
