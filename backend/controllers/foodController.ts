import { Context } from 'hono';
import mongoose from 'mongoose';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import foodModel from '../models/foodModel';
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
		console.log('MongoDB connection state:', mongoose.connection.readyState);

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

		const food = new foodModel({
			name: body['name'],
			description: body['description'],
			price: body['price'],
			category: body['category'],
			image: imageUrl,
		});

		console.log('Attempting to save to MongoDB...');
		const savedFood = await food.save();
		console.log('Food item saved successfully:', savedFood);

		return c.json({
			success: true,
			message: 'Food Added',
			data: savedFood,
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
		console.log('MongoDB connection state:', mongoose.connection.readyState);
		console.log('Attempting to fetch food list from MongoDB');

		if (mongoose.connection.readyState !== 1) {
			console.log('Database not connected, attempting to connect...');
			const { connectDB } = await import('../config/db');
			await connectDB();
		}

		const foods = await Promise.race([
			foodModel.find({}).sort({ createdAt: -1 }),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Database query timeout')), 25000)
			),
		]);

		const processedFoods = foods.map((food) => {
			const foodObj = food.toObject();
			if (!foodObj.image.startsWith('https://')) {
				foodObj.image = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${foodObj.image}`;
			}
			return foodObj;
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

		const food = await foodModel.findById(id);
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

		const deletedFood = await foodModel.findByIdAndDelete(id);
		console.log('Food item deleted successfully:', deletedFood);

		return c.json({
			success: true,
			message: 'Food Removed',
			data: deletedFood,
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

		const existingFood = await foodModel.findById(id);
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

		const updatedFood = await foodModel.findByIdAndUpdate(
			id,
			{
				name: name || existingFood.name,
				description: description || existingFood.description,
				price: price || existingFood.price,
				category: category || existingFood.category,
				image: imageUrl,
			},
			{ new: true }
		);

		console.log('Food item updated successfully:', updatedFood);

		return c.json({
			success: true,
			message: 'Food Updated',
			data: updatedFood,
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
