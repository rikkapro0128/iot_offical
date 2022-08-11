import mongoose from "mongoose";

export default async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/iot_miru');
    console.log('[Successfull]: Connect to database!');
  } catch (error) {
    console.log('[Failure]: Connect to database!');
  }
}