const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  type:    { type: String, enum: ['like','love','haha','wow','sad','angry'], required: true },
}, { timestamps: true });

ReactionSchema.index({ user: 1, article: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', ReactionSchema);