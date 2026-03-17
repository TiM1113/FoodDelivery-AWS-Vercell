import express from 'express';
import { loginUser, registerUser, logoutUser } from '../controllers/userController.js';
import validateRequest, { registerSchema, loginSchema } from '../middleware/validateRequest.js';

const userRouter = express.Router();

userRouter.post('/register', validateRequest(registerSchema), registerUser);
userRouter.post('/login', validateRequest(loginSchema), loginUser);
userRouter.post('/logout', logoutUser);

export default userRouter;
