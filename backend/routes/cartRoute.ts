import { Hono } from 'hono';
import { addToCart, removeFromCart, getCart } from '../controllers/cartController';
import authMiddleware from '../middleware/auth';
import validateBody, { cartItemSchema } from '../middleware/validateRequest';
import type { AppEnv } from '../types';

const cartRoute = new Hono<AppEnv>();

cartRoute.post('/add', authMiddleware, validateBody(cartItemSchema), addToCart);
cartRoute.post('/remove', authMiddleware, validateBody(cartItemSchema), removeFromCart);
cartRoute.post('/get', authMiddleware, getCart);

export default cartRoute;
