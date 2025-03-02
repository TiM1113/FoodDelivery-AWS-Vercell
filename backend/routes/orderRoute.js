import express from 'express'; // this express used for creating a router
import authMiddleware from '../middleware/auth.js'
// import placeOrder from orderController.js
import {
	placeOrder,
	userOrders,
	verifyOrder,
	listOrders,
  updateStatus
} from '../controllers/orderController.js';

// Log that the order router is being initialized
console.log('Order router initialized');

// import { verify } from "jsonwebtoken";

// create a router using express, then using this router to create multiple end points
const orderRouter = express.Router();

// 1- place order end point
orderRouter.post('/place', authMiddleware, placeOrder);
// 2- place order verification end point
orderRouter.post('/verify', verifyOrder);
orderRouter.get('/verify', verifyOrder);  // ✅ 添加新的 GET 端点

// 3- create end point for userOrders
orderRouter.post('/userorders', authMiddleware, userOrders);

// 4- List orders endpoint
orderRouter.get('/list', listOrders); //In Express, route paths must start with a / to be valid
// orderRouter.get('/list', (req, res, next) => {
// 	console.log('GET /list called');
// 	next(); // Proceed to the actual `listOrders` handler
// }, listOrders);

// 5- update orders status in admin panel
orderRouter.post('/status', updateStatus)

// export the place order router, and it will be used in service.js file
export default orderRouter;
