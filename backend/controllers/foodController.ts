import { Context } from 'hono';
import { eq, desc } from 'drizzle-orm';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const addFood = async (c: Context<AppEnv>) => {
	try {
		const body = await c.req.parseBody();
		const file = body['image'];

		if (!(file instanceof File)) {
			return c.json({ success: false, message: 'No image provided' }, 400);
		}

		if (file.size > MAX_FILE_SIZE) {
			return c.json({ success: false, message: 'File too large (max 5MB)' }, 400);
		}

		console.log('Adding new food item with image');
		const timestamp = Date.now();
		const filename = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
		const buffer = Buffer.from(await file.arrayBuffer());

		console.log('Uploading image to S3...');
		await s3Client.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: `uploads/${filename}`,
				Body: buffer,
				ContentType: file.type,
			})
		);

		const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
		console.log('Image uploaded successfully:', imageUrl);

		const [savedFood] = await db.insert(foods).values({
			name: body['name'] as string,
			description: body['description'] as string,
			price: Number(body['price']),
			category: body['category'] as string,
			image: imageUrl,
		}).returning();

		console.log('Food item saved successfully:', savedFood.id);

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
		console.log('Attempting to fetch food list');

		const foodList = await Promise.race([
			db.select().from(foods).orderBy(desc(foods.createdAt)),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Database query timeout')), 25000)
			),
		]);

		const processedFoods = foodList.map((food) => {
			const formatted = formatFood(food);
			if (!formatted.image.startsWith('https://')) {
				formatted.image = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${formatted.image}`;
			}
			return formatted;
		});

		console.log('Processed foods count:', processedFoods.length);

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
		console.log('Attempting to remove food item:', id);

		const [food] = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
		if (!food) {
			return c.json({ success: false, message: 'Food not found' }, 404);
		}

		const urlParts = food.image.split('/');
		const key = `uploads/${urlParts[urlParts.length - 1]}`;

		console.log('Deleting image from S3:', key);
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
			})
		);

		await db.delete(foods).where(eq(foods.id, id));
		console.log('Food item deleted successfully:', id);

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
		const body = await c.req.parseBody();
		const id = body['id'] as string;
		const name = body['name'] as string | undefined;
		const description = body['description'] as string | undefined;
		const price = body['price'] as string | undefined;
		const category = body['category'] as string | undefined;
		const file = body['image'];

		console.log('Attempting to update food item:', id);

		if (!id) {
			return c.json({ success: false, message: 'Food ID is required' }, 400);
		}

		const [existingFood] = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
		if (!existingFood) {
			return c.json({ success: false, message: 'Food not found' }, 404);
		}

		let imageUrl = existingFood.image;

		if (file instanceof File) {
			if (file.size > MAX_FILE_SIZE) {
				return c.json({ success: false, message: 'File too large (max 5MB)' }, 400);
			}

			console.log('New image provided, uploading to S3...');
			const timestamp = Date.now();
			const filename = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
			const buffer = Buffer.from(await file.arrayBuffer());

			await s3Client.send(
				new PutObjectCommand({
					Bucket: process.env.AWS_BUCKET_NAME,
					Key: `uploads/${filename}`,
					Body: buffer,
					ContentType: file.type,
				})
			);

			imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;

			const oldUrlParts = existingFood.image.split('/');
			const oldKey = `uploads/${oldUrlParts[oldUrlParts.length - 1]}`;
			console.log('Deleting old image from S3:', oldKey);

			try {
				await s3Client.send(
					new DeleteObjectCommand({
						Bucket: process.env.AWS_BUCKET_NAME,
						Key: oldKey,
					})
				);
			} catch (deleteError) {
				console.warn('Warning: Could not delete old image:', (deleteError as Error).message);
			}
		}

		const [updatedFood] = await db.update(foods).set({
			name: name || existingFood.name,
			description: description || existingFood.description,
			price: price ? Number(price) : existingFood.price,
			category: category || existingFood.category,
			image: imageUrl,
		}).where(eq(foods.id, id)).returning();

		console.log('Food item updated successfully:', updatedFood.id);

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
