import { Context } from 'hono';
import userModel from '../models/userModel';
import type { AppEnv } from '../types';

export const addToCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { itemId } = await c.req.json();
		const userData = await userModel.findById(userId);
		const cartData = userData.cartData;
		if (!cartData[itemId]) {
			cartData[itemId] = 1;
		} else {
			cartData[itemId] += 1;
		}
		await userModel.findByIdAndUpdate(userId, { cartData });
		return c.json({ success: true, message: 'Added To Cart' });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const removeFromCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const { itemId } = await c.req.json();
		const userData = await userModel.findById(userId);
		const cartData = userData.cartData;
		if (cartData[itemId] > 0) {
			cartData[itemId] -= 1;
		}
		await userModel.findByIdAndUpdate(userId, { cartData });
		return c.json({ success: true, message: 'Removed From Cart' });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};

export const getCart = async (c: Context<AppEnv>) => {
	try {
		const userId = c.get('userId');
		const userData = await userModel.findById(userId);
		const cartData = userData.cartData;
		return c.json({ success: true, cartData });
	} catch (error) {
		console.log(error);
		return c.json({ success: false, message: 'Error' });
	}
};
