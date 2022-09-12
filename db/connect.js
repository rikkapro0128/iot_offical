import mongoose from "mongoose";

export default async () => {
  try {
    await mongoose.connect('mongodb://0.0.0.0:27017/iot_miru', {
      useUnifiedTopology: true,
    });
    console.log('[Successfull]: Connect to database!');
  } catch (error) {
    console.log('[Failure]: Connect to database!');
  }
}
