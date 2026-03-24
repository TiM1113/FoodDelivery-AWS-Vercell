import { randomUUID } from 'node:crypto';
import { Context } from 'hono';
import { eq, desc } from 'drizzle-orm';
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

		const imageUrl = buildImageUrl(imageKey);

		const [savedFood] = await db.insert(foods).values({
			name,
			description,
			price: Number(price),
			category,
			image: imageUrl,
		}).returning();

		console.log('Food item saved:', savedFood.id);

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

export const listFood = async (c: Context<AppEnv>) => {
	try {
		const foodList = await Promise.race([
			db.select().from(foods).orderBy(desc(foods.createdAt)),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Database query timeout')), 25000)
			),
		]);

		const processedFoods = foodList.map((food) => {
			const formatted = formatFood(food);
			if (!formatted.image.startsWith('https://')) {
				formatted.image = buildImageUrl(`uploads/${formatted.image}`);
			}
			return formatted;
		});

		return c.json({
			success: true,
			data: processedFoods,
			count: processedFoods.length,
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

		const [updatedFood] = await db.update(foods).set({
			name: name || existingFood.name,
			description: description || existingFood.description,
			price: price !== undefined ? Number(price) : existingFood.price,
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
