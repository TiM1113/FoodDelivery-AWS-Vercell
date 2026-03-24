import { Hono } from 'hono';
import { addFood, listFood, removeFood, updateFood, presignUpload } from '../controllers/foodController';
import authMiddleware from '../middleware/auth';
import adminMiddleware from '../middleware/adminMiddleware';
import type { AppEnv } from '../types';

const foodRoute = new Hono<AppEnv>();

foodRoute.get('/list', listFood);
foodRoute.post('/presign', authMiddleware, adminMiddleware, presignUpload);
foodRoute.post('/add', authMiddleware, adminMiddleware, addFood);
foodRoute.post('/remove', authMiddleware, adminMiddleware, removeFood);
foodRoute.post('/update', authMiddleware, adminMiddleware, updateFood);

export default foodRoute;
