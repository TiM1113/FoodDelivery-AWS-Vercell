import express from 'express';
// import the controller functions from foodController.js to be route handler in foodRoute.js
import {addFood, listFood, removeFood} from '../controllers/foodController.js';
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

// create endpoints for the according route handlers.
foodRouter.post('/add', upload.single('image'), addFood);
foodRouter.get('/list', listFood);
foodRouter.post('/remove', removeFood);

// set this router in server.js file
export default foodRouter;
