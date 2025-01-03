import userModel from '../models/userModel.js';

// add 3 async arrow functions
// 1- add items to user cart
const addToCart = async (req, res) => {
  try {
    // to find the user data
    let userData = await userModel.findById(req.body.userId);
    let cartData = await userData.cartData;
    if (!cartData[req.body.itemId]) {
      cartData[req.body.itemId] = 1; // first time: it will execute this statement to add item to cart
    } else {
      cartData[req.body.itemId] += 1;
    }
    await userModel.findByIdAndUpdate(req.body.userId, {cartData});
    res.json({success:true, message:"Added To Cart"});
  } catch (error) {
    console.log(error);
    res.json({success:false, message:"Error"})
  }
};

// 2- remove items from user cart
const removeFromCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId) // find the userId by auth.js middleware - decode token and convert it into userId
    // extract the cart data
    let cartData = await userData.cartData;
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= 1;
    }
    await userModel.findByIdAndUpdate(req.body.userId, {cartData});
    res.json({success:true, message:"Removed From Cart"})
  } catch (error) {
    console.log(error);
    res.json({success:false, message:"Error"})
  }
};

// 3- fetch user cart data
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    let cartData = await userData.cartData;
    res.json({success:true, cartData})
  } catch (error) {
    console.log(error);
    res.json({success:false, message:"Error"})
  }
};

// export above 3 arrow functions to be import and used in other components
export {addToCart, removeFromCart, getCart};

// after above functions building we will back to routes to create cartRoute.js and import these 3 arrow async functions in cartRoute.js
