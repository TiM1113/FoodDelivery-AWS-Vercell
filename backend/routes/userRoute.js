import express from 'express';
import { loginUser, registerUser, logoutUser } from '../controllers/userController.js';
import validateRequest, { registerSchema, loginSchema } from '../middleware/validateRequest.js';
import { loginRateLimit, registerRateLimit } from '../middleware/rateLimiter.js';

const userRouter = express.Router();

userRouter.post('/register', registerRateLimit, validateRequest(registerSchema), registerUser);
userRouter.post('/login', loginRateLimit, validateRequest(loginSchema), loginUser);
userRouter.post('/logout', logoutUser);

export default userRouter;
