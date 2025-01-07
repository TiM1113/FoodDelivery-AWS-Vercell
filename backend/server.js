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
const allowedOrigins = [
	'https://admin-kappa-ivory.vercel.app', // Admin production
	'https://food-delivery-aws-vercell.vercel.app', // Frontend production
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
		'token',
		'Authorization',
		'Origin',
		'Accept',
	],
	exposedHeaders: ['Content-Length', 'Content-Type'],
	maxAge: 86400,
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Add request logging middleware
app.use((req, res, next) => {
	console.log('Request from:', req.headers.origin);
	console.log('Request method:', req.method);
	console.log('Request path:', req.path);
	console.log('Request headers:', req.headers);
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
