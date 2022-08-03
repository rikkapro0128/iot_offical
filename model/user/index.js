import mongoose from 'mongoose';
const { Schema } = mongoose;
import bcrypt from 'bcrypt';

/**
 * Define Schemas
 */

 const UserSheme = new Schema({
  name: { type: String, unique: true, require: true },
  hash: { type: String, require: true },
  nickName: { type: String },
  email: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['Nam', 'Nữ'] },
  descYouself: { type: String },
  refreshToken: { type: String },
  nodeManage: [{ type: Schema.Types.ObjectId, ref: 'NodeESP8266' }]
});

UserSheme.pre('save', async function(next) {
  this.hash = await bcrypt.hash(this.password, parseInt(process.env.SALT_ROUND));
  next();
});

const User = mongoose.model('User', UserSheme); 

export default {
  User,
} 
