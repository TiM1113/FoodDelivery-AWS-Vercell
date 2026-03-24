import { MiddlewareHandler } from 'hono';
import { z } from 'zod';

const validateBody = (schema: z.ZodSchema): MiddlewareHandler => {
	return async (c, next) => {
		const body = await c.req.json();
		const result = schema.safeParse(body);
		if (!result.success) {
			const errors = result.error.issues.map(
				(e) => `${e.path.join('.') || 'body'}: ${e.message}`
			);
			return c.json({ success: false, message: 'Validation failed', errors }, 400);
		}
		await next();
	};
};

// ── User schemas ──────────────────────────────────────────────
export const registerSchema = z.object({
	name: z.string().min(1, 'Name is required').max(50),
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

// ── Cart schemas ──────────────────────────────────────────────
export const cartItemSchema = z.object({
	itemId: z.string().uuid('Invalid item ID'),
});

// ── Order schemas ─────────────────────────────────────────────
const addressSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.string().email('Invalid email address'),
	street: z.string().min(1, 'Street is required'),
	city: z.string().min(1, 'City is required'),
	state: z.string().min(1, 'State is required'),
	zipcode: z.string().min(1, 'Zipcode is required'),
	country: z.string().min(1, 'Country is required'),
	phone: z.string().min(1, 'Phone is required'),
});

const orderItemSchema = z.object({
	_id: z.string().uuid('Invalid food item ID'),
	quantity: z.number().int().positive('Quantity must be a positive integer'),
}).passthrough();

export const placeOrderSchema = z.object({
	items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
	address: addressSchema,
	amount: z.number().positive('Amount must be a positive number'),
});

export default validateBody;
