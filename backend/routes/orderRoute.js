import express from 'express';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import validateRequest, { placeOrderSchema } from '../middleware/validateRequest.js';
// import placeOrder from orderController.js
import {
	placeOrder,
	userOrders,
	verifyOrder,
	getOrderStatus,
	handleWebhook,
	listOrders,
  updateStatus,
  retryPayment,
  editOrder,
  deleteOrder
} from '../controllers/orderController.js';

// Log that the order router is being initialized
console.log('Order router initialized');

// import { verify } from "jsonwebtoken";

// create a router using express, then using this router to create multiple end points
const orderRouter = express.Router();

// 1- place order end point
orderRouter.post('/place', authMiddleware, validateRequest(placeOrderSchema), placeOrder);
// 2- Stripe webhook - no auth, raw body already handled in server.js
orderRouter.post('/webhook', handleWebhook);
// 3- cancellation check only - no longer sets payment:true
orderRouter.get('/verify', verifyOrder);
// 4- poll order payment status (frontend polls after redirect from Stripe)
orderRouter.get('/status/:orderId', authMiddleware, getOrderStatus);

// 3- create end point for userOrders
orderRouter.post('/userorders', authMiddleware, userOrders);

// 4- List orders endpoint (admin only)
orderRouter.get('/list', authMiddleware, adminMiddleware, listOrders);

// 5- update orders status in admin panel (admin only)
orderRouter.post('/update', authMiddleware, adminMiddleware, updateStatus);

// 6- retry payment for existing unpaid order
orderRouter.post('/retry-payment', authMiddleware, retryPayment);

// 7- edit unpaid order (add/remove items)
orderRouter.post('/edit', authMiddleware, editOrder);

// 8- delete unpaid order
orderRouter.post('/delete', authMiddleware, deleteOrder);

// export the place order router, and it will be used in service.js file
export default orderRouter;
