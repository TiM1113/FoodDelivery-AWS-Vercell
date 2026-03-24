import type { InferSelectModel } from 'drizzle-orm';
import type { foods, orders, orderItems } from './schema';

type Food = InferSelectModel<typeof foods>;
type Order = InferSelectModel<typeof orders>;
type OrderItem = InferSelectModel<typeof orderItems>;

// Transform Drizzle results to match existing API contract (id → _id, createdAt → date)

export function formatFood(food: Food) {
	return {
		_id: food.id,
		name: food.name,
		description: food.description,
		price: food.price,
		image: food.image,
		category: food.category,
	};
}

export function formatOrder(order: Order & { items: OrderItem[] }) {
	return {
		_id: order.id,
		userId: order.userId,
		items: order.items.map((item) => ({
			_id: item.foodId || item.id,
			name: item.name,
			price: item.price,
			quantity: item.quantity,
		})),
		amount: order.amount,
		address: order.address,
		status: order.status,
		date: order.createdAt,
		payment: order.payment,
	};
}

export function formatOrderBasic(order: Order) {
	return {
		_id: order.id,
		userId: order.userId,
		amount: order.amount,
		address: order.address,
		status: order.status,
		date: order.createdAt,
		payment: order.payment,
	};
}
