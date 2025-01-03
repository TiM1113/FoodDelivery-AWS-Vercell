import express from "express"

// import the 3 cart relative arrow functions from cartController.js
import { addToCart, removeFromCart, getCart } from "../controllers/cartController.js"

// import middleware to connect cart routers (end points)
import authMiddleware from "../middleware/auth.js"; // then this middleware can be add on the 3 cart routers

// after above import we will create one express router
const cartRouter = express.Router(); // using this router to create multiple end points


cartRouter.post("/add", authMiddleware, addToCart) // 1- addToCart function end point + add middleware on this cart router
cartRouter.post("/remove", authMiddleware, removeFromCart) // 2- removeFromCart function end point + add middleware on this cart router
cartRouter.post("/get", authMiddleware, getCart) // 3- getCart function end point + add middleware on this cart router

// export these 3 end points(router)
export default cartRouter; // next these 3 routers will be initialized in server.js
