import 'dotenv/config';
import { validateEnv } from './config/validateEnv';
validateEnv();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import foodRoute from './routes/foodRoute';
import userRoute from './routes/userRoute';
import cartRoute from './routes/cartRoute';
import orderRoute from './routes/orderRoute';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

// CORS configuration
const productionOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

const nodeEnv = process.env.NODE_ENV;
const isDevLike = nodeEnv === 'development' || nodeEnv === 'test';
const developmentOrigins = isDevLike
	? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
	: [];

const allowedOrigins = [...productionOrigins, ...developmentOrigins];

app.use('*', cors({
	origin: allowedOrigins,
	credentials: true,
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
	exposeHeaders: ['Content-Length', 'Content-Type'],
	maxAge: 86400,
}));

// DB connection
connectDB();

// Mount routes
app.route('/api/food', foodRoute);
app.route('/api/user', userRoute);
app.route('/api/cart', cartRoute);
app.route('/api/order', orderRoute);

// Health check endpoints
app.get('/', (c) => {
	return c.json({
		status: 'API Working',
		version: '2.0.0',
		environment: process.env.NODE_ENV || 'development',
		timestamp: new Date().toISOString(),
		mongodb: {
			state: mongoose.connection.readyState,
			states: {
				0: 'disconnected',
				1: 'connected',
				2: 'connecting',
				3: 'disconnecting',
			},
		},
	});
});

app.get('/api/health', (c) => {
	return c.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || 'development',
	});
});

// Global error handler
app.onError((err, c) => {
	console.error('Error:', err);
	return c.json({
		success: false,
		message: err.message || 'Internal Server Error',
		error: process.env.NODE_ENV === 'development' ? String(err) : {},
	}, 500);
});

export default app;
