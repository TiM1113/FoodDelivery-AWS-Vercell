import { Hono } from 'hono';
import { loginUser, registerUser, logoutUser } from '../controllers/userController';
import validateBody, { registerSchema, loginSchema } from '../middleware/validateRequest';
import { loginRateLimit, registerRateLimit } from '../middleware/rateLimiter';
import type { AppEnv } from '../types';

const userRoute = new Hono<AppEnv>();

userRoute.post('/register', registerRateLimit, validateBody(registerSchema), registerUser);
userRoute.post('/login', loginRateLimit, validateBody(loginSchema), loginUser);
userRoute.post('/logout', logoutUser);

export default userRoute;
