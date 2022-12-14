import mongoose from 'mongoose';
const { Schema } = mongoose;
import bcrypt from 'bcrypt';
import { defaultAvatar } from '../../diagram/avatar.js';

/**
 * Define Schemas
 */

 const UserSheme = new Schema({
  name: { type: String, unique: true, require: true },
  hash: { type: String, require: true },
  avatar: {
    type: { type: String, enum: ['default', 'upload'], default: 'default' },
    name: { type: String, default: defaultAvatar[0] },
  },
  nickName: { type: String },
  email: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['Nam', 'Nữ'], default: 'Nam' },
  descYouself: { type: String, default: '' },
  permission: { type: String, enum: ['user', 'admin', 'mod'], default: 'user' },
  status: { type: String, enum: ['blocked', 'login', 'logout'] },
  socketStatus: { type: String, enum: ['online', 'offline'] },
}, { timestamps: true });

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
