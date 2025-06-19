import mongoose from 'mongoose';
import 'dotenv/config';

let cachedConnection = null;
let cachedDbName = null;

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

		// Clear existing connection if database name changed
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
			serverSelectionTimeoutMS: 30000, // Increased to 30s for serverless
			socketTimeoutMS: 30000,
			connectTimeoutMS: 30000,
			maxPoolSize: 10,
			bufferCommands: false, // Disable mongoose buffering
			bufferMaxEntries: 0, // Disable mongoose buffering
		});

		console.log(
			`MongoDB Connected: ${conn.connection.host} to database: ${currentDbName}`
		);
		cachedConnection = conn;
		cachedDbName = currentDbName;

		// Add connection error handler
		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
			cachedConnection = null;
			cachedDbName = null;
		});

		// Add disconnection handler
		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
			cachedConnection = null;
			cachedDbName = null;
		});

		return conn;
	} catch (err) {
		console.error('MongoDB Connection Error:', err.message);
		console.error('Full error:', err);
		console.error('Stack trace:', err.stack);
		throw err; // Let the API handler deal with the error
	}
};
