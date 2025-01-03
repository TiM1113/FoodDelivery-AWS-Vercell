// first we need to import JWT from jsonwebtoken package
import jwt from "jsonwebtoken"

// create one middleware arrow function
const authMiddleware = async (req, resizeBy, next) => {
  const {token} = req.headers; // first: take the token from the users using the headers + then: destructure the token from the request.header
  if (!token) {
    return resizeBy.json({success:false, message:"Not Authorized Login Again"})
  }
  // try-catch block to decode the token if we got 
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id; // convert the token in the user ID to add, remove or get the data from the cart
    next();
  } catch (error) {
    console.log(error);
    resizeBy.json({success:false, message:"Error"});
  }
}

// export the middleware and connect it with the cart routers in cartRoute.js
export default authMiddleware;