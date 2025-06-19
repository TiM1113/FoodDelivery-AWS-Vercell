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
const frontend_url = 'https://fooddelivery-2025.vercel.app';
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
		
		// Check for existing unpaid orders with same items and amount
		const existingUnpaidOrder = await orderModel.findOne({
			userId,
			amount,
			payment: false,
			// Check if created within last 30 minutes to avoid old unpaid orders
			date: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
		});

		let newOrder;
		if (existingUnpaidOrder) {
			// Check if items are the same
			const existingItemsStr = JSON.stringify(existingUnpaidOrder.items.sort((a, b) => a.name.localeCompare(b.name)));
			const newItemsStr = JSON.stringify([...items].sort((a, b) => a.name.localeCompare(b.name)));
			
			if (existingItemsStr === newItemsStr) {
				console.log('Found existing unpaid order with same items, reusing:', existingUnpaidOrder._id);
				newOrder = existingUnpaidOrder;
			} else {
				// Different items, create new order
				const orderItems = [...items];
				console.log('Items different, creating new order');
				newOrder = new orderModel({
					userId,
					items: orderItems,
					amount,
					address,
				});
				await newOrder.save();
			}
		} else {
			// Create a defensive copy of items to prevent any mutation issues
			const orderItems = [...items];
			console.log('Created defensive copy of items:', orderItems);
			
			newOrder = new orderModel({
				userId,
				items: orderItems,
				amount,
				address,
			});
			await newOrder.save(); // saving the created new order in database
		}
		await userModel.findByIdAndUpdate(userId, {cartData: {}}); // using empty cartData:{} value to clear(delete) the user's cart data

		// to create line items for the stripe payment
		const orderItems = newOrder.items;
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
			payment_method_types: ['card'], // Remove au_becs_debit to support higher amounts
			success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}&source=new`,
			cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}&source=new`,
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
		
		// Sort orders by date in descending order (newest first)
		const orders = await orderModel.find({userId: userId}).sort({date: -1});
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
            await orderModel.findByIdAndUpdate(orderId, { 
                payment: true,
                status: "Food Processing"
            });
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
		
		// Find the existing order first
		const existingOrder = await orderModel.findById(orderId);
		if (!existingOrder) {
			return res.status(404).json({
				success: false, 
				message: 'Order not found'
			});
		}
		
		// Prevent updating unpaid orders to processing states
		if (!existingOrder.payment && status !== "Payment Pending") {
			return res.status(400).json({
				success: false, 
				message: 'Cannot process unpaid orders. Payment must be completed first.'
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

// Retry payment for existing unpaid order
const retryPayment = async (req, res) => {
	try {
		const { orderId } = req.body;
		
		if (!orderId) {
			return res.status(400).json({ 
				success: false, 
				message: "Order ID is required" 
			});
		}
		
		// Find the existing unpaid order
		const existingOrder = await orderModel.findById(orderId);
		
		if (!existingOrder) {
			return res.status(404).json({ 
				success: false, 
				message: "Order not found" 
			});
		}
		
		if (existingOrder.payment === true) {
			return res.status(400).json({ 
				success: false, 
				message: "Order is already paid" 
			});
		}
		
		// Create line items from existing order
		const line_items = existingOrder.items.map((item) => ({
			price_data: {
				currency: 'aud',
				product_data: {
					name: item.name,
				},
				unit_amount: Math.round(item.price * 100),
			},
			quantity: item.quantity,
		}));
		
		// Add delivery charges
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
		
		// Create new Stripe session for existing order
		const session = await stripe.checkout.sessions.create({
			line_items: line_items,
			mode: 'payment',
			payment_method_types: ['card'],
			success_url: `${frontend_url}/verify?success=true&orderId=${existingOrder._id}&source=retry`,
			cancel_url: `${frontend_url}/verify?success=false&orderId=${existingOrder._id}&source=retry`,
		});
		
		console.log('Retry payment session created for order:', existingOrder._id);
		res.json({success: true, session_url: session.url});
	} catch (error) {
		console.error("Retry payment error:", error);
		res.status(500).json({ success: false, message: error.message || "Retry payment failed" });
	}
};

// Edit unpaid order - add or remove items
const editOrder = async (req, res) => {
	try {
		const { orderId, items, amount } = req.body;
		
		if (!orderId) {
			return res.status(400).json({ 
				success: false, 
				message: "Order ID is required" 
			});
		}
		
		const existingOrder = await orderModel.findById(orderId);
		
		if (!existingOrder) {
			return res.status(404).json({ 
				success: false, 
				message: "Order not found" 
			});
		}
		
		if (existingOrder.payment === true) {
			return res.status(400).json({ 
				success: false, 
				message: "Cannot edit paid orders" 
			});
		}
		
		// Update order with new items and amount
		await orderModel.findByIdAndUpdate(orderId, {
			items: items,
			amount: amount
		});
		
		res.json({success: true, message: 'Order updated successfully'});
	} catch (error) {
		console.error('Error editing order:', error);
		res.status(500).json({success: false, message: 'Error editing order'});
	}
};

// Delete unpaid order
const deleteOrder = async (req, res) => {
	try {
		const { orderId } = req.body;
		
		if (!orderId) {
			return res.status(400).json({ 
				success: false, 
				message: "Order ID is required" 
			});
		}
		
		const existingOrder = await orderModel.findById(orderId);
		
		if (!existingOrder) {
			return res.status(404).json({ 
				success: false, 
				message: "Order not found" 
			});
		}
		
		if (existingOrder.payment === true) {
			return res.status(400).json({ 
				success: false, 
				message: "Cannot delete paid orders" 
			});
		}
		
		await orderModel.findByIdAndDelete(orderId);
		
		res.json({success: true, message: 'Order deleted successfully'});
	} catch (error) {
		console.error('Error deleting order:', error);
		res.status(500).json({success: false, message: 'Error deleting order'});
	}
};

// export placeOrder function and it will be imported in orderRoute.js
export {placeOrder, userOrders, verifyOrder, listOrders, updateStatus, retryPayment, editOrder, deleteOrder};
