const mongoose = require('mongoose');

const ProfileCommentSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

ProfileCommentSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('ProfileComment', ProfileCommentSchema);