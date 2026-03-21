const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'like',
      'comment',
      'reply',
      'friend_request',
      'friend_accepted',
      'share',
      'comment_like',
      'profile_like',
      'profile_comment',
      'profile_recommendation',
      'love', 'haha', 'wow', 'sad', 'angry',
    ],
    required: true,
  },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  message: { type: String, default: '' },
  link:    { type: String, default: '' },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);