// Create the basic express server
// set up the express server
import express from 'express';
import cors from 'cors';
// DB connection has been imported from config file
import {connectDB} from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js'; // this will be automatically imported when I add the app.use("/api/user", userRouter)  API endpoints

// import .env file to this project
import 'dotenv/config';
import cartRouter from './routes/cartRoute.js';
// import orderModel from './models/orderModel.js';
import orderRouter from './routes/orderRoute.js';

// app config
const app = express();
// Start the server
const port = process.env.PORT || 4000;

// initialize the middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
	origin: [
		process.env.FRONTEND_URL || 'http://localhost:3000',
		process.env.ADMIN_URL || 'http://localhost:3001',
	],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'token', 'Authorization'],
};
app.use(cors(corsOptions));

// DB connection
connectDB();

// Mount the router API endpoints / 3 cart routers from cartRoute.js will be initialized here
app.use('/api/food', foodRouter);
app.use('/images', express.static('uploads'));
app.use('/api/user', userRouter);
// the first initialized router is carToCart router(end point)
app.use('/api/cart', cartRouter); // -> to decode token we will use the middleware
app.use('/api/order', orderRouter);
// log code for debugging
console.log('Server initialized');
console.log('Order router mounted at /api/order');

// use get() to request the data from the server
app.get('/', (req, res) => {
	res.json({
		status: 'API Working',
		version: '1.0.0',
		environment: process.env.NODE_ENV || 'development',
	});
});

// to start the express server
app.listen(port, () => {
	console.log(`Server Started on port ${port}`);
	console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
// mongodb+srv://yuantian1113:Yt7517299879@cluster0.llnlj.mongodb.net/?
