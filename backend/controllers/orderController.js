// import orderModel from models folder

// import { verify } from 'jsonwebtoken';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import Stripe from 'stripe'; // in importing package we use capital Strip

// This API will be linked with frontend
// set up a strip support in orderController component
if (!process.env.STRIPE_SECRET_KEY) {
	console.error('STRIPE_SECRET_KEY is not set in environment variables');
} else {
	console.log('STRIPE_SECRET_KEY is configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// create a variable to store the frontend url
//const frontend_url = 'http://localhost:5174'; // *****should be really care of extra slash "/" was added at the end of url which will lead a "No routes matched location '/verify?success=true&orderId=..." error on the Verify component page.*****
const frontend_url = 'https://frontend-beige-eight-62.vercel.app';
// 1 - placing user order form frontend
const placeOrder = async (req, res) => {
	// create new order logic
	try {
		console.log('Order placement request received');
		console.log('Request body:', JSON.stringify(req.body, null, 2));
		console.log('Request headers token:', req.headers.token ? 'Present' : 'Missing');
		
		// Validate required fields
		const { userId, items, amount, address } = req.body;
		
		console.log('Extracted fields:', { userId, itemsCount: items?.length, amount, address });
		
		if (!userId || !items || !amount || !address) {
			console.log('Validation failed - missing fields');
			return res.status(400).json({ 
				success: false, 
				message: "Missing required fields: userId, items, amount, or address" 
			});
		}
		
		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ 
				success: false, 
				message: "Items must be a non-empty array" 
			});
		}
		
		// Create a defensive copy of items to prevent any mutation issues
		const orderItems = [...items];
		console.log('Created defensive copy of items:', orderItems);
		
		const newOrder = new orderModel({
			userId,
			items: orderItems,
			amount,
			address,
		});
		await newOrder.save(); // saving the created new order in database
		await userModel.findByIdAndUpdate(userId, {cartData: {}}); // using empty cartData:{} value to clear(delete) the user's cart data

		// to create line items for the stripe payment
		console.log('About to create line_items, orderItems is:', orderItems);
		console.log('OrderItems type:', typeof orderItems, 'Array?', Array.isArray(orderItems));
		
		if (!Array.isArray(orderItems) || orderItems.length === 0) {
			throw new Error('OrderItems is not a valid array at Stripe processing stage');
		}
		
		const line_items = orderItems.map((item) => {
			if (!item.name || !item.price || !item.quantity) {
				throw new Error(`Invalid item data: ${JSON.stringify(item)}`);
			}
			return {
				price_data: {
					currency: 'aud',
					product_data: {
						name: item.name,
					},
					unit_amount: Math.round(item.price * 100), // Ensure it's an integer
				},
				quantity: item.quantity,
			};
		});

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

		console.log('Creating Stripe session with line_items:', line_items);
		console.log('Success URL:', `${frontend_url}/verify?success=true&orderId=${newOrder._id}`);
		console.log('Cancel URL:', `${frontend_url}/verify?success=false&orderId=${newOrder._id}`);
		
		// create a session
		const session = await stripe.checkout.sessions.create({
			line_items: line_items,
			mode: 'payment',
			payment_method_types: ['card', 'au_becs_debit'],
			success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
			cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
		});

		console.log('Stripe session created successfully:', session.id);
		res.json({success: true, session_url: session.url});
	} catch (error) {
		console.error("Order placement error:", error); // 让错误信息可见
    res.status(500).json({ success: false, message: error.message || "Order placement failed" });
	}
};

//4- first build User Orders for Frontend in this file, 2)- go to routes folder to create the end point of userOrders
const userOrders = async (req, res) => {
	try {
		const { userId } = req.body;
		
		if (!userId) {
			return res.status(400).json({
				success: false, 
				message: 'Missing userId'
			});
		}
		
		const orders = await orderModel.find({userId: userId});
		res.json({success: true, data: orders});
	} catch (error) {
		console.error('Error fetching user orders:', error);
		res.status(500).json({success: false, message: 'Error fetching orders'});
	}
};

//6- create one temporary payment verification system to verify the order(this is not the perfect way, the perfect way is to use B hooks)
const verifyOrder = async (req, res) => {
	const { orderId, success } = req.query;  // ✅ 改成 req.query，适配 GET 请求

    try {
        if (success === 'true') {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            return res.json({ success: true, message: 'Paid' });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            return res.json({ success: false, message: 'Not Paid' });
        }
    } catch (error) {
        console.error("Order verification error:", error);
        return res.status(500).json({ success: false, message: error.message || 'Error' });
    }
};

//2- API: Listing orders for admin panel - fetch all the orders of all the users
const listOrders = async (req, res) => {
	try {
		const orders = await orderModel.find({});
		res.json({success: true, data: orders});
	} catch (error) {
		console.error('Error listing orders:', error);
		res.status(500).json({success: false, message: 'Error fetching orders list'});
	}
};

// create an API for updating orders status in the admin panel
const updateStatus = async (req, res) => {
	try {
		const { orderId, status } = req.body;
		
		if (!orderId || !status) {
			return res.status(400).json({
				success: false, 
				message: 'Missing orderId or status'
			});
		}
		
		await orderModel.findByIdAndUpdate(orderId, {
			status: status,
		}, {new: true}); // Ensure the updated document is returned
		
		res.json({success: true, message: 'Status Updated'});
	} catch (error) {
		console.error('Error updating order status:', error);
		res.status(500).json({success: false, message: 'Error updating order status'});
	}
};

// export placeOrder function and it will be imported in orderRoute.js
export {placeOrder, userOrders, verifyOrder, listOrders, updateStatus};
