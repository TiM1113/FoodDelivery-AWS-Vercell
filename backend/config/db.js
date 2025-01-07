import mongoose from 'mongoose';
import 'dotenv/config';

export const connectDB = async () => {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI is not defined in environment variables');
		}

		console.log('Attempting to connect to MongoDB...');
		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
		});
		console.log(`MongoDB Connected: ${conn.connection.host}`);

		// Add connection error handler
		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
		});

		// Add disconnection handler
		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
		});
	} catch (err) {
		console.error('MongoDB Connection Error:', err.message);
		console.error('Full error:', err);
		console.error('Stack trace:', err.stack);
		process.exit(1);
	}
};
