import { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { users, addresses } from '../db/schema';
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
		console.error(error);
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
		console.error(error);
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

// ── Profile ─────────────────────────────────────────────────

export const getProfile = async (c: Context<AppEnv>) => {
	const userId = c.get('userId');
	try {
		const [user] = await db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return c.json({ success: false, message: 'User not found' }, 404);
		}

		return c.json({ success: true, data: user });
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error fetching profile' }, 500);
	}
};

export const updateProfile = async (c: Context<AppEnv>) => {
	const userId = c.get('userId');
	const { name } = await c.req.json();
	try {
		const [updated] = await db
			.update(users)
			.set({ name })
			.where(eq(users.id, userId))
			.returning({ id: users.id, name: users.name, email: users.email });

		if (!updated) {
			return c.json({ success: false, message: 'User not found' }, 404);
		}

		return c.json({ success: true, data: updated });
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error updating profile' }, 500);
	}
};

// ── Addresses ───────────────────────────────────────────────

export const getAddresses = async (c: Context<AppEnv>) => {
	const userId = c.get('userId');
	try {
		const rows = await db
			.select()
			.from(addresses)
			.where(eq(addresses.userId, userId))
			.orderBy(addresses.createdAt);

		return c.json({ success: true, data: rows });
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error fetching addresses' }, 500);
	}
};

export const saveAddress = async (c: Context<AppEnv>) => {
	const userId = c.get('userId');
	const body = await c.req.json();
	const { id: addressId, isDefault, ...fields } = body;

	try {
		return await db.transaction(async (tx) => {
			// Lock this user's addresses to prevent concurrent default-address races
			if (isDefault) {
				await tx
					.select({ id: addresses.id })
					.from(addresses)
					.where(eq(addresses.userId, userId))
					.for('update');

				await tx
					.update(addresses)
					.set({ isDefault: false })
					.where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
			}

			if (addressId) {
				// Update existing address — verify ownership
				const [existing] = await tx
					.select({ id: addresses.id })
					.from(addresses)
					.where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
					.limit(1);

				if (!existing) {
					return c.json({ success: false, message: 'Address not found' }, 404);
				}

				const [updated] = await tx
					.update(addresses)
					.set({ ...fields, isDefault })
					.where(eq(addresses.id, addressId))
					.returning();

				return c.json({ success: true, data: updated });
			}

			// Create new address
			const [created] = await tx
				.insert(addresses)
				.values({ ...fields, isDefault, userId })
				.returning();

			return c.json({ success: true, data: created }, 201);
		});
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error saving address' }, 500);
	}
};

export const deleteAddress = async (c: Context<AppEnv>) => {
	const userId = c.get('userId');
	const { addressId } = await c.req.json();

	try {
		return await db.transaction(async (tx) => {
			const [deleted] = await tx
				.delete(addresses)
				.where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
				.returning({ id: addresses.id, isDefault: addresses.isDefault });

			if (!deleted) {
				return c.json({ success: false, message: 'Address not found' }, 404);
			}

			// If the deleted address was the default, promote the most recent remaining one
			let promotedId: string | null = null;
			if (deleted.isDefault) {
				const [next] = await tx
					.select({ id: addresses.id })
					.from(addresses)
					.where(eq(addresses.userId, userId))
					.orderBy(desc(addresses.createdAt))
					.limit(1);

				if (next) {
					await tx
						.update(addresses)
						.set({ isDefault: true })
						.where(eq(addresses.id, next.id));
					promotedId = next.id;
				}
			}

			return c.json({ success: true, message: 'Address deleted', promotedDefaultId: promotedId });
		});
	} catch (error) {
		console.error(error);
		return c.json({ success: false, message: 'Error deleting address' }, 500);
	}
};
