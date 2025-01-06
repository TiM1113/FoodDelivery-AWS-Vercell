import mongoose from 'mongoose';
import 'dotenv/config';

export const connectDB = async () => {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI is not defined in environment variables');
		}

		const conn = await mongoose.connect(process.env.MONGODB_URI);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (err) {
		console.error(
			'MongoDB Connection Error:',
			err instanceof Error ? err.message : 'Unknown error occurred'
		);
		process.exit(1);
	}
};
