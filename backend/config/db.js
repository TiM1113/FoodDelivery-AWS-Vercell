import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect('mongodb+srv://yuantian1113:Yt7517299879@cluster0.llnlj.mongodb.net/project-fooddelivery').then(()=>console.log("DB Connected"))
}