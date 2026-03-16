import userModel from '../models/userModel.js';

// Must run after authMiddleware (which sets req.body.userId)
const adminMiddleware = async (req, res, next) => {
	const userId = req.body.userId;
	if (!userId) {
		return res.json({ success: false, message: 'Not Authorized' });
	}
	try {
		const user = await userModel.findById(userId);
		if (!user || user.role !== 'admin') {
			return res.json({ success: false, message: 'Admin access required' });
		}
		next();
	} catch (error) {
		console.log(error);
		res.json({ success: false, message: 'Error' });
	}
};

export default adminMiddleware;
