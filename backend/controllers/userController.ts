import { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { AppEnv } from '../types';

const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: (process.env.NODE_ENV === 'production' ? 'None' : 'Lax') as 'None' | 'Lax',
	maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

const createToken = (id: string) => {
	return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

export const loginUser = async (c: Context<AppEnv>) => {
	const { email, password } = await c.req.json();
	try {
		const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (!user) {
			return c.json({ success: false, message: 'Invalid email or password' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return c.json({ success: false, message: 'Invalid email or password' });
		}

		const token = createToken(user.id);
		setCookie(c, 'token', token, COOKIE_OPTIONS);
		return c.json({ success: true, role: user.role, userId: user.id, name: user.name });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const registerUser = async (c: Context<AppEnv>) => {
	const { name, password, email } = await c.req.json();
	try {
		const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
		if (exists) {
			return c.json({ success: false, message: 'User already exists' });
		}

		if (!validator.isEmail(email)) {
			return c.json({ success: false, message: 'Please enter a valid email' });
		}

		if (password.length < 8) {
			return c.json({ success: false, message: 'Please enter a strong password' });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const [user] = await db.insert(users).values({
			name,
			email,
			password: hashedPassword,
		}).returning();

		const token = createToken(user.id);
		setCookie(c, 'token', token, COOKIE_OPTIONS);
		return c.json({ success: true, role: user.role });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const logoutUser = (c: Context<AppEnv>) => {
	deleteCookie(c, 'token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: (process.env.NODE_ENV === 'production' ? 'None' : 'Lax') as 'None' | 'Lax',
	});
	return c.json({ success: true, message: 'Logged out' });
};
