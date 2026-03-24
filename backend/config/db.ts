import mongoose from 'mongoose';
import 'dotenv/config';

let cachedConnection: typeof mongoose | null = null;
let cachedDbName: string | null = null;

export const connectDB = async () => {
	const currentDbName = process.env.MONGODB_URI?.split('/')
		?.pop()
		?.split('?')?.[0];

	if (cachedConnection && cachedDbName === currentDbName) {
		console.log('Using cached MongoDB connection to database:', currentDbName);
		return cachedConnection;
	}

	try {
		if (!process.env.MONGODB_URI) {
			throw new Error('MONGODB_URI is not defined in environment variables');
		}

		if (cachedConnection && cachedDbName !== currentDbName) {
			console.log(
				'Database name changed from',
				cachedDbName,
				'to',
				currentDbName
			);
			await mongoose.disconnect();
			cachedConnection = null;
		}

		console.log('Attempting to connect to MongoDB database:', currentDbName);

		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 5000,
			connectTimeoutMS: 5000,
			maxPoolSize: 1,
		});

		console.log(
			`MongoDB Connected: ${conn.connection.host} to database: ${currentDbName}`
		);
		cachedConnection = conn;
		cachedDbName = currentDbName ?? null;

		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
			cachedConnection = null;
			cachedDbName = null;
		});

		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
			cachedConnection = null;
			cachedDbName = null;
		});

		return conn;
	} catch (err) {
		const error = err as Error;
		console.error('MongoDB Connection Error:', error.message);
		console.error('Full error:', error);
		throw error;
	}
};
