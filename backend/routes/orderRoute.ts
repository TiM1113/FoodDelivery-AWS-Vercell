import { Hono } from 'hono';
import authMiddleware from '../middleware/auth';
import adminMiddleware from '../middleware/adminMiddleware';
import validateBody, { placeOrderSchema } from '../middleware/validateRequest';
import { orderRateLimit } from '../middleware/rateLimiter';
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
	deleteOrder,
	cancelOrder,
	validatePromoCode,
} from '../controllers/orderController';
import type { AppEnv } from '../types';

const orderRoute = new Hono<AppEnv>();

orderRoute.post('/place', authMiddleware, orderRateLimit, validateBody(placeOrderSchema), placeOrder);
orderRoute.post('/webhook', handleWebhook);
orderRoute.get('/verify', verifyOrder);
orderRoute.get('/status/:orderId', authMiddleware, getOrderStatus);
orderRoute.post('/userorders', authMiddleware, userOrders);
orderRoute.get('/list', authMiddleware, adminMiddleware, listOrders);
orderRoute.post('/update', authMiddleware, adminMiddleware, updateStatus);
orderRoute.post('/retry-payment', authMiddleware, retryPayment);
orderRoute.post('/edit', authMiddleware, editOrder);
orderRoute.post('/delete', authMiddleware, deleteOrder);
orderRoute.post('/cancel', authMiddleware, cancelOrder);
orderRoute.post('/validate-promo', authMiddleware, orderRateLimit, validatePromoCode);

export default orderRoute;
