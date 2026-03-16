import express from 'express';
import {addFood, listFood, removeFood, updateFood} from '../controllers/foodController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
// Multer is a Node.js middleware used for handling multipart/form-data, which is primarily used for uploading files. It is often used in Express applications to allow users to upload files, such as images, videos, or other types of documents.
import multer from 'multer';

const foodRouter = express.Router();

// Use memory storage instead of disk storage for Vercel
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

// public: anyone can view food list
foodRouter.get('/list', listFood);
// admin only: add, remove, update food items
foodRouter.post('/add', authMiddleware, adminMiddleware, upload.single('image'), addFood);
foodRouter.post('/remove', authMiddleware, adminMiddleware, removeFood);
foodRouter.post('/update', authMiddleware, adminMiddleware, upload.single('image'), updateFood);

// set this router in server.js file
export default foodRouter;
