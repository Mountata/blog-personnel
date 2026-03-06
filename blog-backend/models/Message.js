const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true },
  read:     { type: Boolean, default: false },
  image:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);