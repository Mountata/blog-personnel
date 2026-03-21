const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  author:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true },
  content:       { type: String, required: true },
  images:        [String],
  coverImage:    { type: String, default: '' },
  video:         { type: String, default: '' },
  videoUrl:      { type: String, default: '' },
  videoType:     { type: String, enum: ['upload', 'url', ''], default: '' },
  tags:          [String],
  isPublic:      { type: Boolean, default: true },
  allowComments: { type: Boolean, default: true },
  isDraft:       { type: Boolean, default: false },
  views:         { type: Number, default: 0 },
  viewedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares:        { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Article', ArticleSchema);