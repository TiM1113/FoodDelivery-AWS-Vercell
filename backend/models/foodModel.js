import mongoose from 'mongoose';

// Create the mongoose schema for the food model
const foodSchema = new mongoose.Schema(
	{
		name: {type: String, required: true},
		description: {type: String, required: true},
		price: {type: Number, required: true},
		image: {type: String, required: true},
		category: {type: String, required: true},
	},
	{
		collection: 'foods', // Explicitly set collection name
		versionKey: false, // Disable the version key
	}
);

// Force the model to use the new database
const foodModel = mongoose.models.food || mongoose.model('food', foodSchema);

console.log(
	'Food model initialized with collection:',
	foodModel.collection.name
);
console.log('Current database:', mongoose.connection.name);

export default foodModel;
