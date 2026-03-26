import { Hono } from 'hono';
import {
	loginUser,
	registerUser,
	logoutUser,
	getProfile,
	updateProfile,
	getAddresses,
	saveAddress,
	deleteAddress,
} from '../controllers/userController';
import validateBody, {
	registerSchema,
	loginSchema,
	updateProfileSchema,
	saveAddressSchema,
	deleteAddressSchema,
} from '../middleware/validateRequest';
import { loginRateLimit, registerRateLimit, profileRateLimit } from '../middleware/rateLimiter';
import authMiddleware from '../middleware/auth';
import type { AppEnv } from '../types';

const userRoute = new Hono<AppEnv>();

userRoute.post('/register', registerRateLimit, validateBody(registerSchema), registerUser);
userRoute.post('/login', loginRateLimit, validateBody(loginSchema), loginUser);
userRoute.post('/logout', logoutUser);

// Profile
userRoute.get('/profile', authMiddleware, profileRateLimit, getProfile);
userRoute.put('/profile', authMiddleware, profileRateLimit, validateBody(updateProfileSchema), updateProfile);

// Addresses
userRoute.get('/addresses', authMiddleware, profileRateLimit, getAddresses);
userRoute.post('/addresses', authMiddleware, profileRateLimit, validateBody(saveAddressSchema), saveAddress);
userRoute.delete('/addresses', authMiddleware, profileRateLimit, validateBody(deleteAddressSchema), deleteAddress);

export default userRoute;
