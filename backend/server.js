import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import {connectDB} from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import 'dotenv/config';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';

// app config
const app = express();

// Trust Vercel's reverse proxy so req.ip reflects the real client IP
app.set('trust proxy', 1);

// Webhook route must receive raw body for Stripe signature verification
// Must be registered BEFORE express.json() parses the body
app.use('/api/order/webhook', express.raw({ type: 'application/json' }));

// initialize the middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = [
	'https://admin-kappa-ivory.vercel.app', // Admin production
	'https://fooddelivery-2025.vercel.app', // Frontend production (NEW DOMAIN)
	'https://frontend-beige-eight-62.vercel.app', // Frontend production (OLD DOMAIN - keep for transition)
	'https://backend-ten-azure-58.vercel.app', // Backend production
	'http://localhost:5173', // Frontend development
	'http://localhost:5174', // Admin development
	'http://localhost:3000', // Alternative development port
];

const corsOptions = {
	origin: function (origin, callback) {
		console.log('Request origin:', origin);
		if (!origin || allowedOrigins.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			console.log('Origin not allowed:', origin);
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: [
		'Content-Type',
		'Authorization',
		'Origin',
		'Accept',
	],
	exposedHeaders: ['Content-Length', 'Content-Type'],
	maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(cookieParser());

// DB connection
connectDB();

// Mount the router API endpoints
app.use('/api/food', foodRouter);
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

// Health check endpoint
app.get('/', (req, res) => {
	res.json({
		status: 'API Working',
		version: '1.0.2',
		environment: process.env.NODE_ENV || 'development',
		timestamp: new Date().toISOString(),
		mongodb: {
			state: mongoose.connection.readyState,
			states: {
				0: 'disconnected',
				1: 'connected',
				2: 'connecting',
				3: 'disconnecting'
			}
		}
	});
});

// Simple API test endpoint that doesn't require database
app.get('/api/health', (req, res) => {
	res.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development'
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(err.status || 500).json({
		success: false,
		message: err.message || 'Internal Server Error',
		error: process.env.NODE_ENV === 'development' ? err : {},
	});
});

// For Vercel, we export the app instead of calling listen
export default app;
