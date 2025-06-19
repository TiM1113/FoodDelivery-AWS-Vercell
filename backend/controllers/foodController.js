// This is an API
import foodModel from '../models/foodModel.js';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import mongoose from 'mongoose';

// Configure S3 client
const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

// All business logic should be presented in controller functions.
// add food item (this is a controller)
const addFood = async (req, res) => {
	try {
		console.log('MongoDB connection state:', mongoose.connection.readyState);
		console.log('Request body:', req.body);

		if (!req.file) {
			return res
				.status(400)
				.json({success: false, message: 'No image provided'});
		}

		console.log('Adding new food item with image');
		const timestamp = Date.now();
		const filename = `${timestamp}-${req.file.originalname.replace(
			/\s+/g,
			'_'
		)}`;

		// Upload to S3
		console.log('Uploading image to S3...');
		await s3Client.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: `uploads/${filename}`,
				Body: req.file.buffer,
				ContentType: req.file.mimetype,
			})
		);

		const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
		console.log('Image uploaded successfully:', imageUrl);

		// Save to MongoDB
		console.log('Creating food model with data:', {
			name: req.body.name,
			description: req.body.description,
			price: req.body.price,
			category: req.body.category,
			image: imageUrl,
		});

		const food = new foodModel({
			name: req.body.name,
			description: req.body.description,
			price: req.body.price,
			category: req.body.category,
			image: imageUrl,
		});

		console.log('Attempting to save to MongoDB...');
		const savedFood = await food.save();
		console.log('Food item saved successfully:', savedFood);

		res.status(201).json({
			success: true,
			message: 'Food Added',
			data: savedFood,
		});
	} catch (error) {
		console.error('Error adding food:', error);
		console.error('Stack trace:', error.stack);
		res.status(500).json({
			success: false,
			message: error.message,
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		});
	}
};

// All food list
// Food list API endpoint
const listFood = async (req, res) => {
	try {
		console.log('MongoDB connection state:', mongoose.connection.readyState);
		console.log('Attempting to fetch food list from MongoDB');

		// Ensure database connection is ready
		if (mongoose.connection.readyState !== 1) {
			console.log('Database not connected, attempting to connect...');
			const { connectDB } = await import('../config/db.js');
			await connectDB();
		}

		// Using foodModel model to fetch all the food items with timeout
		const foods = await Promise.race([
			foodModel.find({}).sort({createdAt: -1}),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Database query timeout')), 25000)
			)
		]);

		// Map through foods to ensure all image URLs have the correct format
		const processedFoods = foods.map((food) => {
			const foodObj = food.toObject(); // Convert mongoose doc to plain object

			// If image URL doesn't start with https://, assume it needs the full S3 path
			if (!foodObj.image.startsWith('https://')) {
				foodObj.image = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${foodObj.image}`;
			}

			return foodObj;
		});

		console.log('Processed foods count:', processedFoods.length);
		console.log('Sample food item:', processedFoods[0]); // Log first item for debugging

		// Create one response using the Json object
		res.json({
			success: true,
			data: processedFoods,
			count: processedFoods.length,
		});
	} catch (error) {
		console.error('Error listing food:', error);
		console.error('Stack trace:', error.stack);
		res.status(500).json({
			success: false,
			message: 'Error fetching food items',
			error: error.message,
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		});
	}
};

//Remove food items
const removeFood = async (req, res) => {
	try {
		console.log('MongoDB connection state:', mongoose.connection.readyState);
		console.log('Attempting to remove food item:', req.body.id);

		// read id from the post request
		const food = await foodModel.findById(req.body.id);
		if (!food) {
			return res.status(404).json({success: false, message: 'Food not found'});
		}

		// Extract the key from the image URL
		const urlParts = food.image.split('/');
		const key = `uploads/${urlParts[urlParts.length - 1]}`;

		// Delete from S3
		console.log('Deleting image from S3:', key);
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
			})
		);

		// Delete from MongoDB
		console.log('Deleting food item from MongoDB');
		const deletedFood = await foodModel.findByIdAndDelete(req.body.id);
		console.log('Food item deleted successfully:', deletedFood);

		res.json({
			success: true,
			message: 'Food Removed',
			data: deletedFood,
		});
	} catch (error) {
		console.error('Error removing food:', error);
		console.error('Stack trace:', error.stack);
		res.status(500).json({
			success: false,
			message: error.message,
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		});
	}
};

// Update food item
const updateFood = async (req, res) => {
	try {
		console.log('MongoDB connection state:', mongoose.connection.readyState);
		console.log('Attempting to update food item:', req.body.id);
		console.log('Update data:', req.body);

		const {id, name, description, price, category} = req.body;

		if (!id) {
			return res.status(400).json({success: false, message: 'Food ID is required'});
		}

		// Find the existing food item
		const existingFood = await foodModel.findById(id);
		if (!existingFood) {
			return res.status(404).json({success: false, message: 'Food not found'});
		}

		let imageUrl = existingFood.image;

		// If a new image is provided, upload it to S3
		if (req.file) {
			console.log('New image provided, uploading to S3...');
			const timestamp = Date.now();
			const filename = `${timestamp}-${req.file.originalname.replace(/\s+/g, '_')}`;

			// Upload new image to S3
			await s3Client.send(
				new PutObjectCommand({
					Bucket: process.env.AWS_BUCKET_NAME,
					Key: `uploads/${filename}`,
					Body: req.file.buffer,
					ContentType: req.file.mimetype,
				})
			);

			imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;

			// Delete old image from S3
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
				console.warn('Warning: Could not delete old image:', deleteError.message);
			}
		}

		// Update the food item in MongoDB
		const updatedFood = await foodModel.findByIdAndUpdate(
			id,
			{
				name: name || existingFood.name,
				description: description || existingFood.description,
				price: price || existingFood.price,
				category: category || existingFood.category,
				image: imageUrl,
			},
			{new: true}
		);

		console.log('Food item updated successfully:', updatedFood);

		res.json({
			success: true,
			message: 'Food Updated',
			data: updatedFood,
		});
	} catch (error) {
		console.error('Error updating food:', error);
		console.error('Stack trace:', error.stack);
		res.status(500).json({
			success: false,
			message: error.message,
			details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
		});
	}
};

export {addFood, listFood, removeFood, updateFood};
