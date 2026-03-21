const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, default: '' },
  images: [String],
  likes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, default: '' },
  images:  [String],
  likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [ReplySchema],
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);