import mongoose from 'mongoose';

export interface IUser {
	name: string;
	email: string;
	password: string;
	cartData: Record<string, number>;
	role: 'user' | 'admin';
}

const userSchema = new mongoose.Schema<IUser>({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	cartData: { type: Object, default: {} },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model<IUser>('user', userSchema);

export default userModel;
