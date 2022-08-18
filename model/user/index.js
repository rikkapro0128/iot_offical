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
  permission: { type: String, enum: ['user', 'admin', 'mod'] },
  status: { type: String, enum: ['blocked', 'login', 'logout'] }, 
  refreshToken: { type: String },
});

UserSheme.pre('save', async function(next) {
  try {
    if(this.password && typeof this.password === 'string') {
      this.hash = await bcrypt.hash(this.password, parseInt(process.env.SALT_ROUND));
      next();
    }
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', UserSheme); 

export default {
  User,
} 
