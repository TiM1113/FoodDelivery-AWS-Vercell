import mongoose from 'mongoose';

export interface IOrderItem {
	_id: string;
	name: string;
	price: number;
	quantity: number;
}

export interface IAddress {
	firstName: string;
	lastName: string;
	email: string;
	street: string;
	city: string;
	state: string;
	zipcode: string;
	country: string;
	phone: string;
}

export interface IOrder {
	userId: string;
	items: IOrderItem[];
	amount: number;
	address: IAddress;
	status: string;
	date: Date;
	payment: boolean;
}

const orderSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	items: { type: [mongoose.Schema.Types.Mixed], required: true },
	amount: { type: Number, required: true },
	address: { type: Object, required: true },
	status: { type: String, default: 'Payment Pending' },
	date: { type: Date, default: Date.now },
	payment: { type: Boolean, default: false },
});

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;
