import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const createToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const loginUser = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await userModel.findOne({ email });
		if (!user) {
			return res.json({ success: false, message: 'Invalid email or password' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.json({ success: false, message: 'Invalid email or password' });
		}

		const token = createToken(user._id);
		res.cookie('token', token, COOKIE_OPTIONS);
		res.json({ success: true, role: user.role });
	} catch (error) {
		console.log(error);
		res.json({ success: false, message: 'Error' });
	}
};

const registerUser = async (req, res) => {
	const { name, password, email } = req.body;
	try {
		const exists = await userModel.findOne({ email });
		if (exists) {
			return res.json({ success: false, message: 'User already exists' });
		}

		if (!validator.isEmail(email)) {
			return res.json({ success: false, message: 'Please enter a valid email' });
		}

		if (password.length < 8) {
			return res.json({ success: false, message: 'Please enter a strong password' });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new userModel({ name, email, password: hashedPassword });
		const user = await newUser.save();

		const token = createToken(user._id);
		res.cookie('token', token, COOKIE_OPTIONS);
		res.json({ success: true, role: user.role });
	} catch (error) {
		console.log(error);
		res.json({ success: false, message: 'Error' });
	}
};

const logoutUser = (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	});
	res.json({ success: true, message: 'Logged out' });
};

export { loginUser, registerUser, logoutUser };
