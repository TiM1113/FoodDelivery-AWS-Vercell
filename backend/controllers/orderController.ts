import { Context } from 'hono';
import Stripe from 'stripe';
import { eq, and, gte, desc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems, users, foods } from '../db/schema';
import { formatOrder } from '../db/helpers';
import type { AppEnv } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const frontend_url = process.env.FRONTEND_URL;

export const placeOrder = async (c: Context<AppEnv>) => {
	try {
		console.log('Order placement request received');

		const userId = c.get('userId');
		const body = await c.req.json();
		const { items, amount, address } = body;

		console.log('Extracted fields:', { userId, itemsCount: items?.length, amount, address });

		if (!userId || !items || !amount || !address) {
			return c.json({
				success: false,
				message: 'Missing required fields: userId, items, amount, or address',
			}, 400);
		}

		if (!Array.isArray(items) || items.length === 0) {
			return c.json({
				success: false,
				message: 'Items must be a non-empty array',
			}, 400);
		}

		// Validate all food items exist and get authoritative prices
		const foodIds = items.map((item: { _id: string }) => item._id);
		const dbFoods = await db.select().from(foods).where(inArray(foods.id, foodIds));
		const foodMap = Object.fromEntries(dbFoods.map((f) => [f.id, f]));

		const missingIds = foodIds.filter((id: string) => !foodMap[id]);
		if (missingIds.length > 0) {
			return c.json({
				success: false,
				message: `Food items not found: ${missingIds.join(', ')}`,
			}, 400);
		}

		// Check for existing unpaid duplicate order
		const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
		const [existingUnpaidOrder] = await db
			.select()
			.from(orders)
			.where(
				and(
					eq(orders.userId, userId),
					eq(orders.amount, amount),
					eq(orders.payment, false),
					gte(orders.createdAt, thirtyMinutesAgo)
				)
			)
			.limit(1);

		let orderId: string;

		if (existingUnpaidOrder) {
			const existingItems = await db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, existingUnpaidOrder.id));

			const existingItemsStr = JSON.stringify(
				existingItems
					.map((i) => ({ name: i.name, quantity: i.quantity }))
					.sort((a, b) => a.name.localeCompare(b.name))
			);
			const newItemsStr = JSON.stringify(
				[...items]
					.map((i: { _id: string; quantity: number }) => ({
						name: foodMap[i._id].name,
						quantity: i.quantity,
					}))
					.sort((a, b) => a.name.localeCompare(b.name))
			);

			if (existingItemsStr === newItemsStr) {
				console.log('Found existing unpaid order with same items, reusing:', existingUnpaidOrder.id);
				orderId = existingUnpaidOrder.id;
			} else {
				console.log('Items different, creating new order');
				const [newOrder] = await db.insert(orders).values({
					userId,
					amount,
					address,
				}).returning();

				await db.insert(orderItems).values(
					items.map((item: { _id: string; quantity: number }) => ({
						orderId: newOrder.id,
						foodId: item._id,
						name: foodMap[item._id].name,
						price: foodMap[item._id].price,
						quantity: item.quantity,
					}))
				);

				orderId = newOrder.id;
			}
		} else {
			const [newOrder] = await db.insert(orders).values({
				userId,
				amount,
				address,
			}).returning();

			await db.insert(orderItems).values(
				items.map((item: { _id: string; quantity: number }) => ({
					orderId: newOrder.id,
					foodId: item._id,
					name: foodMap[item._id].name,
					price: foodMap[item._id].price,
					quantity: item.quantity,
				}))
			);

			orderId = newOrder.id;
		}

		// Clear user cart
		await db.update(users).set({ cartData: {} }).where(eq(users.id, userId));

		// Create Stripe line items using authoritative DB prices
		const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
			(item: { _id: string; quantity: number }) => {
				const dbFood = foodMap[item._id];
				return {
					price_data: {
						currency: 'aud',
						product_data: { name: dbFood.name },
						unit_amount: Math.round(dbFood.price * 100),
					},
					quantity: item.quantity,
				};
			}
		);

		line_items.push({
			price_data: {
				currency: 'aud',
				product_data: { name: 'Delivery Charges' },
				unit_amount: 2 * 100,
			},
			quantity: 1,
		});

		const session = await stripe.checkout.sessions.create({
			line_items,
			mode: 'payment',
			payment_method_types: ['card'],
			success_url: `${frontend_url}/verify?orderId=${orderId}&source=new`,
			cancel_url: `${frontend_url}/verify?success=false&orderId=${orderId}&source=new`,
			metadata: { orderId },
			locale: 'en',
			billing_address_collection: 'required',
			shipping_address_collection: {
				allowed_countries: ['AU', 'US', 'CA', 'GB'],
			},
		});

		console.log('Stripe session created successfully:', session.id);
		return c.json({ success: true, session_url: session.url });
	} catch (error) {
		const err = error as Error;
		console.error('Order placement error:', err);
		return c.json({
			success: false,
			message: err.message || 'Order placement failed',
		}, 500);
	}
};

export const userOrders = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');

		if (!userId) {
			return c.json({ success: false, message: 'Missing userId' }, 400);
		}

		const result = await db.query.orders.findMany({
			where: eq(orders.userId, userId),
			orderBy: [desc(orders.createdAt)],
			with: { items: true },
		});

		return c.json({ success: true, data: result.map(formatOrder) });
	} catch (error) {
		console.error('Error fetching user orders:', error);
		return c.json({ success: false, message: 'Error fetching orders' }, 500);
	}
};

export const verifyOrder = async (c: Context<AppEnv>) => {
	const orderId = c.req.query('orderId');
	const success = c.req.query('success');

	try {
		if (success === 'false') {
			if (orderId) {
				await db.delete(orders).where(eq(orders.id, orderId));
			}
			return c.json({ success: false, message: 'Order cancelled' });
		}
		if (!orderId) return c.json({ success: false, message: 'Order not found' }, 404);

		const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!order) return c.json({ success: false, message: 'Order not found' }, 404);
		return c.json({ success: order.payment, message: order.payment ? 'Paid' : 'Pending' });
	} catch (error) {
		const err = error as Error;
		console.error('Order verification error:', err);
		return c.json({ success: false, message: err.message || 'Error' }, 500);
	}
};

export const getOrderStatus = async (c: Context<AppEnv>) => {
	const orderId = c.req.param('orderId');
	if (!orderId) return c.json({ success: false, message: 'Order ID required' }, 400);
	try {
		const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!order) return c.json({ success: false, message: 'Order not found' }, 404);
		return c.json({ success: true, payment: order.payment, status: order.status });
	} catch (error) {
		const err = error as Error;
		console.error('Error fetching order status:', err);
		return c.json({ success: false, message: err.message || 'Error' }, 500);
	}
};

export const handleWebhook = async (c: Context<AppEnv>) => {
	const sig = c.req.header('stripe-signature');
	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		console.error('STRIPE_WEBHOOK_SECRET is not set');
		return c.json({ success: false, message: 'Webhook secret not configured' }, 500);
	}

	let event: Stripe.Event;
	try {
		const rawBody = await c.req.text();
		event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		const error = err as Error;
		console.error('Webhook signature verification failed:', error.message);
		return c.text(`Webhook Error: ${error.message}`, 400);
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session;
		const orderId = session.metadata?.orderId;
		if (!orderId) {
			console.error('Webhook: missing orderId in session metadata');
			return c.json({ received: true });
		}
		try {
			await db.update(orders).set({
				payment: true,
				status: 'Food Processing',
			}).where(eq(orders.id, orderId));
			console.log(`Webhook: order ${orderId} marked as paid`);
		} catch (error) {
			console.error('Webhook: error updating order:', error);
			return c.json({ success: false, message: 'Error updating order' }, 500);
		}
	}

	return c.json({ received: true });
};

export const listOrders = async (c: Context<AppEnv>) => {
	try {
		const result = await db.query.orders.findMany({
			with: { items: true },
		});
		return c.json({ success: true, data: result.map(formatOrder) });
	} catch (error) {
		console.error('Error listing orders:', error);
		return c.json({ success: false, message: 'Error fetching orders list' }, 500);
	}
};

export const updateStatus = async (c: Context<AppEnv>) => {
	try {
		const { orderId, status } = await c.req.json();

		if (!orderId || !status) {
			return c.json({ success: false, message: 'Missing orderId or status' }, 400);
		}

		const [existingOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!existingOrder) {
			return c.json({ success: false, message: 'Order not found' }, 404);
		}

		if (!existingOrder.payment && status !== 'Payment Pending') {
			return c.json({
				success: false,
				message: 'Cannot process unpaid orders. Payment must be completed first.',
			}, 400);
		}

		await db.update(orders).set({ status }).where(eq(orders.id, orderId));
		return c.json({ success: true, message: 'Status Updated' });
	} catch (error) {
		console.error('Error updating order status:', error);
		return c.json({ success: false, message: 'Error updating order status' }, 500);
	}
};

export const retryPayment = async (c: Context<AppEnv>) => {
	try {
		const { orderId } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		const existingOrder = await db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			with: { items: true },
		});

		if (!existingOrder) {
			return c.json({ success: false, message: 'Order not found' }, 404);
		}

		if (existingOrder.payment === true) {
			return c.json({ success: false, message: 'Order is already paid' }, 400);
		}

		const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = existingOrder.items.map(
			(item) => ({
				price_data: {
					currency: 'aud',
					product_data: { name: item.name },
					unit_amount: Math.round(item.price * 100),
				},
				quantity: item.quantity,
			})
		);

		line_items.push({
			price_data: {
				currency: 'aud',
				product_data: { name: 'Delivery Charges' },
				unit_amount: 2 * 100,
			},
			quantity: 1,
		});

		const session = await stripe.checkout.sessions.create({
			line_items,
			mode: 'payment',
			payment_method_types: ['card'],
			success_url: `${frontend_url}/verify?orderId=${existingOrder.id}&source=retry`,
			cancel_url: `${frontend_url}/verify?success=false&orderId=${existingOrder.id}&source=retry`,
			metadata: { orderId: existingOrder.id },
			locale: 'en',
			billing_address_collection: 'required',
			shipping_address_collection: {
				allowed_countries: ['AU', 'US', 'CA', 'GB'],
			},
		});

		console.log('Retry payment session created for order:', existingOrder.id);
		return c.json({ success: true, session_url: session.url });
	} catch (error) {
		const err = error as Error;
		console.error('Retry payment error:', err);
		return c.json({
			success: false,
			message: err.message || 'Retry payment failed',
		}, 500);
	}
};

export const editOrder = async (c: Context<AppEnv>) => {
	try {
		const { orderId, items, amount } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		const [existingOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!existingOrder) {
			return c.json({ success: false, message: 'Order not found' }, 404);
		}

		if (existingOrder.payment === true) {
			return c.json({ success: false, message: 'Cannot edit paid orders' }, 400);
		}

		// Replace order items
		if (items && Array.isArray(items)) {
			await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
			if (items.length > 0) {
				await db.insert(orderItems).values(
					items.map((item: { _id: string; name: string; price: number; quantity: number }) => ({
						orderId,
						foodId: item._id,
						name: item.name,
						price: item.price,
						quantity: item.quantity,
					}))
				);
			}
		}

		if (amount !== undefined) {
			await db.update(orders).set({ amount }).where(eq(orders.id, orderId));
		}

		return c.json({ success: true, message: 'Order updated successfully' });
	} catch (error) {
		console.error('Error editing order:', error);
		return c.json({ success: false, message: 'Error editing order' }, 500);
	}
};

export const deleteOrder = async (c: Context<AppEnv>) => {
	try {
		const { orderId } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		const [existingOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!existingOrder) {
			return c.json({ success: false, message: 'Order not found' }, 404);
		}

		if (existingOrder.payment === true) {
			return c.json({ success: false, message: 'Cannot delete paid orders' }, 400);
		}

		// CASCADE will delete order_items automatically
		await db.delete(orders).where(eq(orders.id, orderId));
		return c.json({ success: true, message: 'Order deleted successfully' });
	} catch (error) {
		console.error('Error deleting order:', error);
		return c.json({ success: false, message: 'Error deleting order' }, 500);
	}
};
