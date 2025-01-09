// This script helps move images from local storage to Amazon S3 cloud storage
import {
	S3Client,
	PutObjectCommand,
	CopyObjectCommand,
	ListObjectsCommand,
} from '@aws-sdk/client-s3';
import foodModel from '../models/foodModel.js'; // Our database model for food items
import {connectDB} from '../config/db.js'; // Database connection helper

// Set up our connection to Amazon S3
const s3Client = new S3Client({
	region: process.env.AWS_REGION || 'ap-southeast-2', // Default to Sydney region
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID, // AWS access key
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // AWS secret key
	},
});

// The name of our S3 bucket where images will be stored
const bucketName = process.env.AWS_BUCKET_NAME || 'food-delivery-images-bucket';

// Main function that does all the work
async function migrateImagesToUploadsFolder() {
	try {
		// Connect to MongoDB
		await connectDB();
		console.log('Connected to MongoDB');

		// Get all food items
		const foods = await foodModel.find({});
		console.log(`Found ${foods.length} food items to process`);

		for (const food of foods) {
			try {
				// Skip if image URL doesn't contain our bucket
				if (!food.image.includes(bucketName)) {
					console.log(`Skipping ${food.name} - not in our S3 bucket`);
					continue;
				}

				// Get the current image key (filename)
				const currentKey = food.image.split('.com/').pop();

				// Skip if already in uploads folder
				if (currentKey.startsWith('uploads/')) {
					console.log(`Skipping ${food.name} - already in uploads folder`);
					continue;
				}

				// Create new key with 'uploads/' prefix
				const newKey = `uploads/${currentKey}`;

				// Copy object to new location
				const copyCommand = new CopyObjectCommand({
					Bucket: bucketName,
					CopySource: `${bucketName}/${currentKey}`,
					Key: newKey,
				});

				await s3Client.send(copyCommand);

				// Update the database with new URL
				const newS3Url = `https://${bucketName}.s3.${
					process.env.AWS_REGION || 'ap-southeast-2'
				}.amazonaws.com/${newKey}`;
				food.image = newS3Url;
				await food.save();

				console.log(
					`Successfully moved ${currentKey} to ${newKey} for ${food.name}`
				);
			} catch (error) {
				console.error(`Error processing ${food.name}:`, error.message);
			}
		}

		console.log('Migration to uploads folder complete!');
	} catch (error) {
		console.error('Migration failed:', error);
	}
}

// Start the migration
migrateImagesToUploadsFolder();
