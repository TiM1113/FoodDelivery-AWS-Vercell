// Import userModel from userModel.js in models folder
import userModel from '../models/userModel.js';

// jwt used for creating the authentication
import jwt from 'jsonwebtoken';

// bcrypt tool used for encrypting(hashing) user's passwords
import bcrypt from 'bcrypt';
import validator from 'validator';

// the logic for login user
const loginUser = async (req, res) => {
	const {email, password} = req.body;
	try {
		const user = await userModel.findOne({email});
		if (!user) {
			return res.json({success: false, message: "User Doesn't exist"});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.json({success: false, message: 'Invalid credentials'});
		}

		const token = createToken(user._id);
		res.json({success: true, token});
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

// create a function to create token for new users
const createToken = (id) => {
	return jwt.sign({id}, process.env.JWT_SECRET);
};

// register user
const registerUser = async (req, res) => {
	// use below const variable to store the destructured request body data
	const {name, password, email} = req.body;
	try {
		const exists = await userModel.findOne({email}); // this line used for checking whether the user already exist.
		if (exists) {
			return res.json({success: false, message: 'User already exists'});
		}

		// validating email format & strong password
		if (!validator.isEmail(email)) {
			return res.json({success: false, message: 'Please enter a valid email'});
		}

		if (password.length < 8) {
			return res.json({
				success: false,
				message: 'Please enter a strong password',
			});
		}

		// 1 + 2: hashing user's password by using bcrypt tool imported
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// 3: after above two steps we are going to create a new user
		const newUser = new userModel({
			name: name,
			email: email,
			password: hashedPassword,
		});

		// 4: save the created new user in the database
		const user = await newUser.save();
		// 5: generate the user's token by user id
		const token = createToken(user._id);
		// 6: sent the token as response
		res.json({success: true, token});
	} catch (error) {
		console.log(error);
		res.json({success: false, message: 'Error'});
	}
};

export {loginUser, registerUser};
