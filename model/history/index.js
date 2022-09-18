import mongoose from 'mongoose';
const { Schema } = mongoose;

const HistorySheme = new Schema({
  bindUser: { type: Schema.Types.ObjectId },
  action: { type: String, default: '' },
  typeAction: { type: String, default: '' },
  desc: { type: String, default: '' },
  options: { type: Schema.Types.Mixed },
}, { timestamps: true });

const User = mongoose.model('History', HistorySheme); 

export default {
  User,
} 

