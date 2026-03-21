const mongoose = require('mongoose');

const CirclePostSchema = new mongoose.Schema({

  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  // ─── Contenu ─────────────────────────────────────────────────
  content: { type: String, required: true },
  images:  [String],

  // ─── Type de post ────────────────────────────────────────────
  // post    = post normal
  // poll    = sondage (lié à CirclePoll)
  // event   = événement (lié à CircleEvent)
  type: {
    type:    String,
    enum:    ['post', 'poll', 'event'],
    default: 'post'
  },

  // Référence vers le sondage ou l'événement si type != 'post'
  pollRef:  { type: mongoose.Schema.Types.ObjectId, ref: 'CirclePoll',  default: null },
  eventRef: { type: mongoose.Schema.Types.ObjectId, ref: 'CircleEvent', default: null },

  // ─── Réactions ───────────────────────────────────────────────
  // [{ user: ObjectId, emoji: '👍' }]
  reactions: [{
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],

  // ─── Commentaires ────────────────────────────────────────────
  comments: [{
    author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // ─── Épinglé ─────────────────────────────────────────────────
  isPinned: { type: Boolean, default: false },

  // ─── Vues ────────────────────────────────────────────────────
  views:    { type: Number, default: 0 },
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

CirclePostSchema.index({ circle: 1, createdAt: -1 });
CirclePostSchema.index({ author: 1 });

module.exports = mongoose.model('CirclePost', CirclePostSchema);