// This is an API
import foodModel from '../models/foodModel.js';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';

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
		if (!req.file) {
			return res.json({success: false, message: 'No image provided'});
		}

		const timestamp = Date.now();
		const filename = `${timestamp}-${req.file.originalname.replace(
			/\s+/g,
			'_'
		)}`;

		// Upload to S3
		await s3Client.send(
			new PutObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: `uploads/${filename}`,
				Body: req.file.buffer,
				ContentType: req.file.mimetype,
			})
		);

		const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;

		const food = new foodModel({
			name: req.body.name,
			description: req.body.description,
			price: req.body.price,
			category: req.body.category,
			image: imageUrl,
		});

		await food.save();
		res.json({success: true, message: 'Food Added'});
	} catch (error) {
		console.error('Error adding food:', error);
		res.json({success: false, message: error.message});
	}
};

// All food list
// Food list API endpoint
const listFood = async (req, res) => {
	try {
		// Using foodModel model to fitch all the food items
		const foods = await foodModel.find({});
		// Create one response using the Json object
		res.json({success: true, data: foods});
	} catch (error) {
		console.error('Error listing food:', error);
		res.json({success: false, message: error.message});
	}
};

//Remove food items
const removeFood = async (req, res) => {
	try {
		// read id from the post request
		const food = await foodModel.findById(req.body.id);
		if (!food) {
			return res.json({success: false, message: 'Food not found'});
		}

		// Extract the key from the image URL
		const urlParts = food.image.split('/');
		const key = `uploads/${urlParts[urlParts.length - 1]}`;

		// Delete from S3
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: key,
			})
		);

		await foodModel.findByIdAndDelete(req.body.id);
		res.json({success: true, message: 'Food Removed'});
	} catch (error) {
		console.error('Error removing food:', error);
		res.json({success: false, message: error.message});
	}
};

export {addFood, listFood, removeFood};
