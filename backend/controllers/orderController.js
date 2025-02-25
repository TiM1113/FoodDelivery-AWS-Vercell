// import orderModel from models folder

// import { verify } from 'jsonwebtoken';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import Stripe from 'stripe'; // in importing package we use capital Strip

// This API will be linked with frontend
// set up a strip support in orderController component
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// create a variable to store the frontend url
//const frontend_url = 'http://localhost:5174'; // *****should be really care of extra slash "/" was added at the end of url which will lead a "No routes matched location '/verify?success=true&orderId=..." error on the Verify component page.*****
const frontend_url = 'https://frontend-beige-eight-62.vercel.app/';
// 1 - placing user order form frontend
const placeOrder = async (req, res) => {
	// create new order logic
	try {
		const newOrder = new orderModel({
			userId: req.body.userId,
			items: req.body.items,
			amount: req.body.amount,
			address: req.body.address,
		});
		await newOrder.save(); // saving the created new order in database
		await userModel.findByIdAndUpdate(req.body.userId, {cartData: {}}); // using empty cartData:{} value to clear(delete) the user's cart data

		// to create line items for the stripe payment
		const line_items = req.body.items.map((item) => ({
			price_data: {
				currency: 'aud',
				product_data: {
					name: item.name,
				},
				unit_amount: item.price * 100, // Just like INR to USD (using 80 as the INR factor), here the AUD to USD conversion factor is 0.65, and you would multiply by 100 to get cents.
			},
			quantity: item.quantity,
		}));

		// adding delivery charges
		line_items.push({
			price_data: {
				currency: 'aud',
				product_data: {
					name: 'Delivery Charges',
				},
				unit_amount: 2 * 100,
			},
			quantity: 1,
		});

		// create a session
		const session = await stripe.checkout.sessions.create({
			line_items: line_items,
			mode: 'payment',
			success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
			cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
		});

		res.json({success: true, session_url: session.url});
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

//4- first build User Orders for Frontend in this file, 2)- go to routes folder to create the end point of userOrders
const userOrders = async (req, res) => {
	try {
		const orders = await orderModel.find({userId: req.body.userId});
		res.json({success: true, data: orders});
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

//6- create one temporary payment verification system to verify the order(this is not the perfect way, the perfect way is to use B hooks)
const verifyOrder = async (req, res) => {
	const {orderId, success} = req.body;
	try {
		if (success == 'true') {
			await orderModel.findByIdAndUpdate(orderId, {payment: true});
			res.json({success: true, message: 'Paid'});
		} else {
			await orderModel.findByIdAndDelete(orderId);
			res.json({success: false, message: 'Not Paid'});
		}
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

//2- API: Listing orders for admin panel - fetch all the orders of all the users
const listOrders = async (req, res) => {
	try {
		const orders = await orderModel.find({});
		res.json({success: true, data: orders});
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

// create an API for updating orders status in the admin panel
const updateStatus = async (req, res) => {
	try {
		await orderModel.findByIdAndUpdate(req.body.orderId, {
			status: req.body.status,
		}),
			{new: true}; // Ensure the updated document is returned
		res.json({success: true, message: 'Status Updated'});
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

// export placeOrder function and it will be imported in orderRoute.js
export {placeOrder, userOrders, verifyOrder, listOrders, updateStatus};
