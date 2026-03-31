import { randomUUID } from 'node:crypto';
import { Context } from 'hono';
import { eq, desc, asc, ilike, and, gte, lte, lt, gt, or, type SQL } from 'drizzle-orm';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../db';
import { foods } from '../db/schema';
import { formatFood } from '../db/helpers';
import type { AppEnv } from '../types';

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

const PRESIGN_EXPIRES = 300; // 5 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function buildImageUrl(key: string): string {
	return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

function extractS3Key(imageUrl: string): string {
	const urlParts = imageUrl.split('/');
	return `uploads/${urlParts[urlParts.length - 1]}`;
}

export const presignUpload = async (c: Context<AppEnv>) => {
	try {
		const { fileName, contentType } = await c.req.json();

		if (!fileName || !contentType) {
			return c.json({ success: false, message: 'fileName and contentType are required' }, 400);
		}

		if (!ALLOWED_TYPES.includes(contentType)) {
			return c.json({ success: false, message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, 400);
		}

		const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
		const key = `uploads/${randomUUID()}${ext}`;

		const command = new PutObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
		});

		const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRES });

		return c.json({ success: true, uploadUrl, key });
	} catch (error) {
		const err = error as Error;
		console.error('Error generating presigned URL:', err);
		return c.json({ success: false, message: err.message }, 500);
	}
};

export const addFood = async (c: Context<AppEnv>) => {
	try {
		const { name, description, price, category, imageKey } = await c.req.json();

		if (!name || !description || !price || !category || !imageKey) {
			return c.json({ success: false, message: 'All fields are required (name, description, price, category, imageKey)' }, 400);
		}

		if (typeof imageKey !== 'string' || !imageKey.startsWith('uploads/')) {
			return c.json({ success: false, message: 'Invalid imageKey' }, 400);
		}

		const parsedPrice = Number(price);
		if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
			return c.json({ success: false, message: 'Price must be a positive number' }, 400);
		}

		const imageUrl = buildImageUrl(imageKey);

		const [savedFood] = await db.insert(foods).values({
			name,
			description,
			price: parsedPrice,
			category,
			image: imageUrl,
		}).returning();

		return c.json({
			success: true,
			message: 'Food Added',
			data: formatFood(savedFood),
		}, 201);
	} catch (error) {
		const err = error as Error;
		console.error('Error adding food:', err);
		return c.json({
			success: false,
			message: err.message,
			details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		}, 500);
	}
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export const listFood = async (c: Context<AppEnv>) => {
	try {
		const q = c.req.query('q')?.trim();
		const category = c.req.query('category');
		const minPrice = c.req.query('minPrice');
		const maxPrice = c.req.query('maxPrice');
		const sortBy = c.req.query('sortBy');
		const cursor = c.req.query('cursor');
		const limitParam = c.req.query('limit');

		const rawLimit = limitParam != null ? parseInt(limitParam, 10) : DEFAULT_PAGE_SIZE;
		const limit = Math.min(
			Math.max(1, isNaN(rawLimit) ? DEFAULT_PAGE_SIZE : rawLimit),
			MAX_PAGE_SIZE,
		);

		// Build filter conditions
		const conditions: SQL[] = [];

		if (q) {
			conditions.push(
				or(
					ilike(foods.name, `%${q}%`),
					ilike(foods.description, `%${q}%`),
				)!,
			);
		}

		if (category) {
			conditions.push(eq(foods.category, category));
		}

		if (minPrice) {
			const min = parseFloat(minPrice);
			if (!isNaN(min)) conditions.push(gte(foods.price, min));
		}

		if (maxPrice) {
			const max = parseFloat(maxPrice);
			if (!isNaN(max)) conditions.push(lte(foods.price, max));
		}

		// Decode compound cursor: { value, id }
		const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (cursor) {
			try {
				const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString());
				if (typeof parsed.value !== 'string' || typeof parsed.id !== 'string' || !UUID_RE.test(parsed.id)) {
					throw new Error('Invalid cursor payload');
				}
				if ((sortBy === 'price_asc' || sortBy === 'price_desc') && !Number.isFinite(parseFloat(parsed.value))) {
					throw new Error('Invalid cursor payload');
				}
				if (sortBy !== 'price_asc' && sortBy !== 'price_desc' && sortBy !== 'name_asc' && isNaN(Date.parse(parsed.value))) {
					throw new Error('Invalid cursor payload');
				}
				const cursorId: string = parsed.id;
				switch (sortBy) {
					case 'price_asc': {
						const v = parseFloat(parsed.value);
						conditions.push(
							or(
								and(eq(foods.price, v), gt(foods.id, cursorId)),
								gt(foods.price, v),
							)!,
						);
						break;
					}
					case 'price_desc': {
						const v = parseFloat(parsed.value);
						conditions.push(
							or(
								and(eq(foods.price, v), gt(foods.id, cursorId)),
								lt(foods.price, v),
							)!,
						);
						break;
					}
					case 'name_asc':
						conditions.push(
							or(
								and(eq(foods.name, parsed.value), gt(foods.id, cursorId)),
								gt(foods.name, parsed.value),
							)!,
						);
						break;
					default: {
						// Use millisecond range to avoid sub-ms precision loss from JS Date round-trip
						const d = new Date(parsed.value);
						const dNext = new Date(d.getTime() + 1);
						conditions.push(
							or(
								and(gte(foods.createdAt, d), lt(foods.createdAt, dNext), gt(foods.id, cursorId)),
								lt(foods.createdAt, d),
							)!,
						);
						break;
					}
				}
			} catch {
				// Invalid cursor — ignore and start from first page
			}
		}

		// Build sort with secondary tiebreaker on id
		const orderClauses = (() => {
			switch (sortBy) {
				case 'price_asc': return [asc(foods.price), asc(foods.id)];
				case 'price_desc': return [desc(foods.price), asc(foods.id)];
				case 'name_asc': return [asc(foods.name), asc(foods.id)];
				default: return [desc(foods.createdAt), asc(foods.id)];
			}
		})();

		const query = db.select().from(foods);
		const filtered = conditions.length > 0
			? query.where(and(...conditions))
			: query;

		// Fetch limit + 1 to determine if there are more items
		const foodList = await filtered
			.orderBy(...orderClauses)
			.limit(limit + 1);

		const hasMore = foodList.length > limit;
		const pageItems = hasMore ? foodList.slice(0, limit) : foodList;

		const processedFoods = pageItems.map((food) => {
			const formatted = formatFood(food);
			if (!formatted.image.startsWith('https://')) {
				formatted.image = buildImageUrl(`uploads/${formatted.image}`);
			}
			return formatted;
		});

		// Build next cursor from the last item (base64url-encoded compound key)
		let nextCursor: string | null = null;
		if (hasMore && pageItems.length > 0) {
			const lastItem = pageItems[pageItems.length - 1];
			let value: string;
			switch (sortBy) {
				case 'price_asc':
				case 'price_desc':
					value = String(lastItem.price);
					break;
				case 'name_asc':
					value = lastItem.name;
					break;
				default:
					value = lastItem.createdAt.toISOString();
					break;
			}
			nextCursor = Buffer.from(JSON.stringify({ value, id: lastItem.id })).toString('base64url');
		}

		return c.json({
			success: true,
			data: processedFoods,
			count: processedFoods.length,
			nextCursor,
		});
	} catch (error) {
		const err = error as Error;
		console.error('Error listing food:', err);
		return c.json({
			success: false,
			message: 'Error fetching food items',
			error: err.message,
			details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		}, 500);
	}
};

export const removeFood = async (c: Context<AppEnv>) => {
	try {
		const { id } = await c.req.json();

		const [food] = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
		if (!food) {
			return c.json({ success: false, message: 'Food not found' }, 404);
		}

		const key = extractS3Key(food.image);

		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
			})
		);

		await db.delete(foods).where(eq(foods.id, id));

		return c.json({
			success: true,
			message: 'Food Removed',
			data: formatFood(food),
		});
	} catch (error) {
		const err = error as Error;
		console.error('Error removing food:', err);
		return c.json({
			success: false,
			message: err.message,
			details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		}, 500);
	}
};

export const updateFood = async (c: Context<AppEnv>) => {
	try {
		const { id, name, description, price, category, imageKey } = await c.req.json();

		if (!id) {
			return c.json({ success: false, message: 'Food ID is required' }, 400);
		}

		const [existingFood] = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
		if (!existingFood) {
			return c.json({ success: false, message: 'Food not found' }, 404);
		}

		let imageUrl = existingFood.image;
		let oldKeyToDelete: string | null = null;

		if (imageKey) {
			if (typeof imageKey !== 'string' || !imageKey.startsWith('uploads/')) {
				return c.json({ success: false, message: 'Invalid imageKey' }, 400);
			}

			imageUrl = buildImageUrl(imageKey);
			oldKeyToDelete = extractS3Key(existingFood.image);
		}

		let finalPrice = existingFood.price;
		if (price !== undefined) {
			const parsedPrice = Number(price);
			if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
				return c.json({ success: false, message: 'Price must be a positive number' }, 400);
			}
			finalPrice = parsedPrice;
		}

		const [updatedFood] = await db.update(foods).set({
			name: name || existingFood.name,
			description: description || existingFood.description,
			price: finalPrice,
			category: category || existingFood.category,
			image: imageUrl,
		}).where(eq(foods.id, id)).returning();

		// Delete old image AFTER successful DB update
		if (oldKeyToDelete) {
			try {
				await s3Client.send(
					new DeleteObjectCommand({
						Bucket: process.env.AWS_BUCKET_NAME,
						Key: oldKeyToDelete,
					})
				);
			} catch (deleteError) {
				console.warn('Warning: Could not delete old image:', (deleteError as Error).message);
			}
		}

		return c.json({
			success: true,
			message: 'Food Updated',
			data: formatFood(updatedFood),
		});
	} catch (error) {
		const err = error as Error;
		console.error('Error updating food:', err);
		return c.json({
			success: false,
			message: err.message,
			details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
		}, 500);
	}
};
