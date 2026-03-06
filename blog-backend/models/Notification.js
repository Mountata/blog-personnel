const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['like','comment','reply','friend_request','friend_accepted','share','comment_like'],
    required: true
  },
  article:  { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  comment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  read:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);