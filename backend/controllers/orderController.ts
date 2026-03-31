import { Context } from 'hono';
import Stripe from 'stripe';
import { eq, and, gte, desc, inArray, sql, count, sum } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems, users, foods } from '../db/schema';
import { formatOrder } from '../db/helpers';
import type { AppEnv } from '../types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const frontend_url = process.env.FRONTEND_URL;
const DELIVERY_FEE = 2;

export const placeOrder = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const body = await c.req.json();
		const { items, address } = body;

		if (!userId || !items || !address) {
			return c.json({
				success: false,
				message: 'Missing required fields: userId, items, or address',
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

		// Calculate amount server-side from authoritative DB prices
		const amount = Math.round(
			(items.reduce(
				(sum: number, item: { _id: string; quantity: number }) =>
					sum + foodMap[item._id].price * item.quantity,
				0
			) + DELIVERY_FEE) * 100
		) / 100;

		// Pre-validate promo code BEFORE any order mutation (prevents dangling orders on promo rejection)
		const { promoCode } = body;
		let validatedPromoId: string | null = null;
		let discountAmount: number | null = null;

		if (promoCode && typeof promoCode === 'string') {
			try {
				const promoCodes = await stripe.promotionCodes.retrieve(promoCode, {
					expand: ['coupon'],
				});

				if (!promoCodes.active) {
					return c.json({
						success: false,
						message: 'Promo code is no longer active. Please remove it and try again.',
					}, 400);
				}

				// Enforce minimum order amount
				const minAmount = promoCodes.restrictions.minimum_amount
					? promoCodes.restrictions.minimum_amount / 100
					: null;

				if (minAmount && amount < minAmount) {
					return c.json({
						success: false,
						message: `Minimum order amount for this promo is $${minAmount.toFixed(2)}`,
					}, 400);
				}

				validatedPromoId = promoCodes.id;

				// Calculate discount amount for order record
				const coupon = promoCodes.coupon;
				if (coupon.percent_off) {
					discountAmount = Math.round(amount * (coupon.percent_off / 100) * 100) / 100;
				} else if (coupon.amount_off) {
					discountAmount = Math.min(coupon.amount_off / 100, amount);
				}
			} catch {
				return c.json({
					success: false,
					message: 'Promo code not found or invalid',
				}, 400);
			}
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

			const addressMatch = JSON.stringify(existingUnpaidOrder.address) === JSON.stringify(address);

			if (existingItemsStr === newItemsStr && addressMatch) {
				orderId = existingUnpaidOrder.id;
				await db.update(users).set({ cartData: {} }).where(eq(users.id, userId));
			} else {
				orderId = await db.transaction(async (tx) => {
					const [newOrder] = await tx.insert(orders).values({
						userId,
						amount,
						address,
					}).returning();

					await tx.insert(orderItems).values(
						items.map((item: { _id: string; quantity: number }) => ({
							orderId: newOrder.id,
							foodId: item._id,
							name: foodMap[item._id].name,
							price: foodMap[item._id].price,
							quantity: item.quantity,
						}))
					);

					await tx.update(users).set({ cartData: {} }).where(eq(users.id, userId));

					return newOrder.id;
				});
			}
		} else {
			orderId = await db.transaction(async (tx) => {
				const [newOrder] = await tx.insert(orders).values({
					userId,
					amount,
					address,
				}).returning();

				await tx.insert(orderItems).values(
					items.map((item: { _id: string; quantity: number }) => ({
						orderId: newOrder.id,
						foodId: item._id,
						name: foodMap[item._id].name,
						price: foodMap[item._id].price,
						quantity: item.quantity,
					}))
				);

				await tx.update(users).set({ cartData: {} }).where(eq(users.id, userId));

				return newOrder.id;
			});
		}

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
				unit_amount: DELIVERY_FEE * 100,
			},
			quantity: 1,
		});

		const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
		};

		// Apply validated promo to session params
		if (validatedPromoId) {
			sessionParams.discounts = [{ promotion_code: validatedPromoId }];
		}

		// Include promo state in idempotency key to handle param changes across retries
		const promoSuffix = validatedPromoId ? `_p${validatedPromoId}` : '';
		const session = await stripe.checkout.sessions.create(
			sessionParams,
			{ idempotencyKey: `order_${orderId}${promoSuffix}` },
		);

		// Always update promo fields to clear stale values from reused orders
		await db.update(orders).set({
			promoCode: validatedPromoId,
			discountAmount: validatedPromoId ? discountAmount : null,
		}).where(eq(orders.id, orderId));

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
		// Read-only: cancelled payments are handled by webhook + authenticated cancelOrder
		if (success === 'false') {
			return c.json({ success: false, message: 'Payment cancelled' });
		}
		if (!orderId) return c.json({ success: false, message: 'Order not found' }, 404);

		const [order] = await db.select({ payment: orders.payment, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!order) return c.json({ success: false, message: 'Order not found' }, 404);
		return c.json({ success: order.payment, message: order.payment ? 'Paid' : 'Pending' });
	} catch (error) {
		const err = error as Error;
		console.error('Order verification error:', err);
		return c.json({ success: false, message: err.message || 'Error' }, 500);
	}
};

export const getOrderStatus = async (c: Context<AppEnv>) => {
	const userId = c.get('userId');
	const orderId = c.req.param('orderId');
	if (!orderId) return c.json({ success: false, message: 'Order ID required' }, 400);
	try {
		const [order] = await db.select().from(orders).where(
			and(eq(orders.id, orderId), eq(orders.userId, userId))
		).limit(1);
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
			const paymentIntentId = typeof session.payment_intent === 'string'
				? session.payment_intent
				: session.payment_intent?.id ?? null;

			const [updated] = await db.update(orders).set({
				payment: true,
				status: 'Food Processing',
				stripePaymentIntentId: paymentIntentId,
			}).where(
				and(eq(orders.id, orderId), eq(orders.payment, false)),
			).returning({ id: orders.id });

			if (!updated) {
				// Order already paid or cancelled — no action needed
			}
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

export const getDashboardStats = async (c: Context<AppEnv>) => {
	try {
		// Total revenue (paid orders only)
		const [revenueResult] = await db
			.select({ total: sum(orders.amount) })
			.from(orders)
			.where(eq(orders.payment, true));

		// Total order count
		const [orderCountResult] = await db
			.select({ total: count() })
			.from(orders);

		// Total user count
		const [userCountResult] = await db
			.select({ total: count() })
			.from(users);

		// Total food item count
		const [foodCountResult] = await db
			.select({ total: count() })
			.from(foods);

		// Order status distribution
		const statusDistribution = await db
			.select({
				status: orders.status,
				count: count(),
			})
			.from(orders)
			.groupBy(orders.status);

		// Daily revenue for last 30 days (paid orders)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const dailyRevenue = await db
			.select({
				date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
				revenue: sum(orders.amount),
				orderCount: count(),
			})
			.from(orders)
			.where(and(eq(orders.payment, true), gte(orders.createdAt, thirtyDaysAgo)))
			.groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
			.orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

		// Top selling items (by quantity)
		const topItems = await db
			.select({
				name: orderItems.name,
				totalQuantity: sum(orderItems.quantity),
			})
			.from(orderItems)
			.innerJoin(orders, eq(orderItems.orderId, orders.id))
			.where(eq(orders.payment, true))
			.groupBy(orderItems.name)
			.orderBy(desc(sum(orderItems.quantity)))
			.limit(5);

		return c.json({
			success: true,
			data: {
				totalRevenue: Number(revenueResult.total) || 0,
				totalOrders: orderCountResult.total,
				totalUsers: userCountResult.total,
				totalFoods: foodCountResult.total,
				statusDistribution: statusDistribution.map((s) => ({
					status: s.status,
					count: s.count,
				})),
				dailyRevenue: dailyRevenue.map((d) => ({
					date: d.date,
					revenue: Number(d.revenue) || 0,
					orders: d.orderCount,
				})),
				topItems: topItems.map((item) => ({
					name: item.name,
					quantity: Number(item.totalQuantity) || 0,
				})),
			},
		});
	} catch (error) {
		const err = error as Error;
		console.error('Error fetching dashboard stats:', err);
		return c.json({ success: false, message: err.message }, 500);
	}
};

const VALID_ORDER_STATUSES = [
	'Payment Pending',
	'Food Processing',
	'Out for Delivery',
	'Delivered',
	'Cancelled',
] as const;

export const updateStatus = async (c: Context<AppEnv>) => {
	try {
		const { orderId, status } = await c.req.json();

		if (!orderId || !status) {
			return c.json({ success: false, message: 'Missing orderId or status' }, 400);
		}

		if (!VALID_ORDER_STATUSES.includes(status)) {
			return c.json({ success: false, message: `Invalid status: ${status}` }, 400);
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
		const userId = c.get('userId');
		const { orderId } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		const existingOrder = await db.query.orders.findFirst({
			where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
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
				unit_amount: DELIVERY_FEE * 100,
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
		const userId = c.get('userId');
		const { orderId, items } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		if (!items || !Array.isArray(items) || items.length === 0) {
			return c.json({ success: false, message: 'Items must be a non-empty array' }, 400);
		}

		if (items.length > 50) {
			return c.json({ success: false, message: 'Too many items' }, 400);
		}

		const [existingOrder] = await db.select().from(orders).where(
			and(eq(orders.id, orderId), eq(orders.userId, userId))
		).limit(1);
		if (!existingOrder) {
			return c.json({ success: false, message: 'Order not found' }, 404);
		}

		if (existingOrder.payment === true) {
			return c.json({ success: false, message: 'Cannot edit paid orders' }, 400);
		}

		// Server-side price lookup — never trust client prices
		const foodIds = items.map((item: { _id: string; quantity: number }) => item._id);
		const foodList = await db.select().from(foods).where(inArray(foods.id, foodIds));
		const foodMap: Record<string, { name: string; price: number }> = {};
		for (const f of foodList) {
			foodMap[f.id] = { name: f.name, price: f.price };
		}

		// Validate all items exist in database
		for (const item of items) {
			if (!foodMap[item._id]) {
				return c.json({ success: false, message: `Food item not found: ${item._id}` }, 400);
			}
			if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
				return c.json({ success: false, message: 'Quantity must be between 1 and 99' }, 400);
			}
		}

		// Server-side amount calculation
		const serverAmount = items.reduce(
			(sum: number, item: { _id: string; quantity: number }) =>
				sum + foodMap[item._id].price * item.quantity,
			0,
		) + DELIVERY_FEE;

		// Atomic replace: delete old items + insert new items + update amount
		await db.transaction(async (tx) => {
			await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
			await tx.insert(orderItems).values(
				items.map((item: { _id: string; quantity: number }) => ({
					orderId,
					foodId: item._id,
					name: foodMap[item._id].name,
					price: foodMap[item._id].price,
					quantity: item.quantity,
				}))
			);
			await tx.update(orders).set({ amount: serverAmount }).where(eq(orders.id, orderId));
		});

		return c.json({ success: true, message: 'Order updated successfully' });
	} catch (error) {
		console.error('Error editing order:', error);
		return c.json({ success: false, message: 'Error editing order' }, 500);
	}
};

export const validatePromoCode = async (c: Context<AppEnv>) => {
	try {
		const { code } = await c.req.json();

		if (!code || typeof code !== 'string') {
			return c.json({ success: false, message: 'Promo code is required' }, 400);
		}

		const promotionCodes = await stripe.promotionCodes.list({
			code: code.trim().toUpperCase(),
			active: true,
			limit: 1,
			expand: ['data.coupon'],
		});

		if (promotionCodes.data.length === 0) {
			return c.json({ success: false, message: 'Invalid or expired promo code' });
		}

		const promo = promotionCodes.data[0];
		const coupon = promo.coupon;

		// Return minimum_amount so frontend/backend can enforce it
		const minimumAmount = promo.restrictions.minimum_amount
			? promo.restrictions.minimum_amount / 100
			: null;

		return c.json({
			success: true,
			promoId: promo.id,
			minimumAmount,
			coupon: {
				percentOff: coupon.percent_off,
				amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
				currency: coupon.currency,
				name: coupon.name,
			},
		});
	} catch (error) {
		const err = error as Error;
		console.error('Promo validation error:', err);
		return c.json({ success: false, message: 'Error validating promo code' }, 500);
	}
};

const CANCELLABLE_STATUSES = ['Payment Pending', 'Food Processing'] as const;

export const cancelOrder = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { orderId } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		// Atomic UPDATE: only succeeds if order exists, belongs to user, and is cancellable
		const [updated] = await db
			.update(orders)
			.set({ status: 'Cancelled' })
			.where(
				and(
					eq(orders.id, orderId),
					eq(orders.userId, userId),
					inArray(orders.status, [...CANCELLABLE_STATUSES]),
				),
			)
			.returning();

		if (!updated) {
			// Determine why: order not found vs wrong status
			const [existing] = await db
				.select({ id: orders.id, status: orders.status })
				.from(orders)
				.where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
				.limit(1);

			if (!existing) {
				return c.json({ success: false, message: 'Order not found' }, 404);
			}
			return c.json({
				success: false,
				message: `Cannot cancel order with status "${existing.status}"`,
			}, 400);
		}

		// Determine previous status for rollback (Payment Pending→unpaid, Food Processing→paid)
		const previousStatus = updated.payment ? 'Food Processing' : 'Payment Pending';

		// If paid, issue Stripe refund using stored paymentIntentId
		let refundId: string | null = null;
		if (updated.payment && updated.stripePaymentIntentId) {
			try {
				const refund = await stripe.refunds.create({
					payment_intent: updated.stripePaymentIntentId,
				});
				refundId = refund.id;
			} catch (refundError) {
				console.error('Refund failed, rolling back cancellation:', refundError);
				// Rollback: restore previous status
				await db
					.update(orders)
					.set({ status: previousStatus })
					.where(eq(orders.id, orderId));

				return c.json({
					success: false,
					message: 'Refund failed. Order status restored. Please try again later.',
				}, 502);
			}
		}

		const message = refundId
			? 'Order cancelled and refund initiated'
			: updated.payment
				? 'Order cancelled. Refund requires manual follow-up.'
				: 'Order cancelled';

		return c.json({ success: true, message, refundId });
	} catch (error) {
		const err = error as Error;
		console.error('Cancel order error:', err);
		return c.json({ success: false, message: err.message || 'Error cancelling order' }, 500);
	}
};

export const deleteOrder = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { orderId } = await c.req.json();

		if (!orderId) {
			return c.json({ success: false, message: 'Order ID is required' }, 400);
		}

		const [existingOrder] = await db.select().from(orders).where(
			and(eq(orders.id, orderId), eq(orders.userId, userId))
		).limit(1);
		if (!existingOrder) {
			return c.json({ success: false, message: 'Order not found' }, 404);
		}

		if (existingOrder.payment === true) {
			return c.json({ success: false, message: 'Cannot delete paid orders' }, 400);
		}

		// CASCADE will delete order_items automatically
		await db.delete(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
		return c.json({ success: true, message: 'Order deleted successfully' });
	} catch (error) {
		console.error('Error deleting order:', error);
		return c.json({ success: false, message: 'Error deleting order' }, 500);
	}
};
