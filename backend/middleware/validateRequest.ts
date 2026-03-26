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
	promoCode: z.string().optional(),
});

// ── Profile schemas ──────────────────────────────────────────
export const updateProfileSchema = z.object({
	name: z.string().min(1, 'Name is required').max(50),
});

export const saveAddressSchema = z.object({
	id: z.string().uuid().optional(),
	label: z.string().min(1).max(50).default('Home'),
	firstName: z.string().min(1, 'First name is required').max(50),
	lastName: z.string().min(1, 'Last name is required').max(50),
	email: z.string().email('Invalid email address'),
	street: z.string().min(1, 'Street is required').max(200),
	city: z.string().min(1, 'City is required').max(100),
	state: z.string().min(1, 'State is required').max(100),
	zipcode: z.string().min(1, 'Zipcode is required').max(20),
	country: z.string().min(1, 'Country is required').max(100),
	phone: z.string().min(1, 'Phone is required').max(30),
	isDefault: z.boolean().default(false),
});

export const deleteAddressSchema = z.object({
	addressId: z.string().uuid('Invalid address ID'),
});

export default validateBody;
