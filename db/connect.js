import mongoose from "mongoose";

export default async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/iot_miru');
    console.log('[Successfull]: Connect to database!');
  } catch (error) {
    console.log('[Failure]: Connect to database!');
  }
}