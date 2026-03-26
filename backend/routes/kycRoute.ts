import { Hono } from 'hono';
import authMiddleware from '../middleware/auth';
import adminMiddleware from '../middleware/adminMiddleware';
import {
	getKycStatus,
	createVerificationSession,
	handleIdentityWebhook,
} from '../controllers/kycController';
import type { AppEnv } from '../types';

const kycRoute = new Hono<AppEnv>();

kycRoute.get('/status', authMiddleware, adminMiddleware, getKycStatus);
kycRoute.post('/create-session', authMiddleware, adminMiddleware, createVerificationSession);
kycRoute.post('/webhook', handleIdentityWebhook);

export default kycRoute;
