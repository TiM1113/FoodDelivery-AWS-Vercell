import mongoose from "mongoose"

// To defined one data schema for users in userModel.js in modules folder
const userSchema = new mongoose.Schema({
  name:{type:String, required:true},
  email:{type:String, required:true, unique:true},
  password:{type:String, required:true},
  cartData:{type:Object, default:{}},
}, {minimize:false})

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

// we need to export this model
export default userModel;