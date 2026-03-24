import mongoose from 'mongoose';

export interface IFood {
	name: string;
	description: string;
	price: number;
	image: string;
	category: string;
}

const foodSchema = new mongoose.Schema<IFood>(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		price: { type: Number, required: true },
		image: { type: String, required: true },
		category: { type: String, required: true },
	},
	{
		collection: 'foods',
		versionKey: false,
	}
);

const foodModel = mongoose.models.food || mongoose.model<IFood>('food', foodSchema);

export default foodModel;
