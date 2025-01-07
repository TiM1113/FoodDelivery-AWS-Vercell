// Create the basic express server
import express from 'express';
import cors from 'cors';
import {connectDB} from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import 'dotenv/config';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';

// app config
const app = express();

// initialize the middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
	origin: [
		process.env.FRONTEND_URL || 'http://localhost:5173',
		process.env.ADMIN_URL || 'http://localhost:5174',
		'https://admin-kappa-ivory.vercel.app',
		'https://food-delivery-aws-vercell.vercel.app',
		'https://frontend-beige-eight-62.vercel.app',
	],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: [
		'Content-Type',
		'token',
		'Authorization',
		'Origin',
		'Accept',
	],
	exposedHeaders: ['Content-Length', 'Content-Type'],
	maxAge: 86400,
};

// Add CORS logging middleware
app.use((req, res, next) => {
	console.log('Request from:', req.headers.origin);
	console.log('Request method:', req.method);
	console.log('Request path:', req.path);
	next();
});

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
		version: '1.0.0',
		environment: process.env.NODE_ENV || 'development',
	});
});

// For Vercel, we export the app instead of calling listen
export default app;
