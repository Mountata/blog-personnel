const mongoose = require('mongoose');

const CircleSchema = new mongoose.Schema({

  // ─── Infos de base ───────────────────────────────────────────
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '', maxlength: 300 },
  coverImage:  { type: String, default: '' },
  emoji:       { type: String, default: '⭕' }, // emoji choisi par le créateur

  // ─── Créateur ────────────────────────────────────────────────
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Type de cercle ──────────────────────────────────────────
  // public  = visible dans recherche, libre d'accès
  // private = visible mais sur invitation uniquement
  // secret  = invisible, lien uniquement
  type: {
    type:    String,
    enum:    ['public', 'private', 'secret'],
    default: 'private'
  },

  // ─── Tags / centres d'intérêt ────────────────────────────────
  // Utilisés par le système de suggestions intelligentes
  tags: [{ type: String, lowercase: true, trim: true }],

  // ─── Réactions personnalisées du cercle ──────────────────────
  // Le créateur peut définir des emojis custom pour ce cercle
  customReactions: [{
    emoji: { type: String },
    label: { type: String }
  }],

  // ─── Post épinglé ────────────────────────────────────────────
  pinnedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'CirclePost', default: null },

  // ─── Compteurs (dénormalisés pour la performance) ────────────
  memberCount: { type: Number, default: 1 },
  postCount:   { type: Number, default: 0 },

  // ─── Lien d'invitation secret ────────────────────────────────
  inviteToken: { type: String, default: '' },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Index pour la recherche par nom et tags
CircleSchema.index({ name: 'text', tags: 'text' });
CircleSchema.index({ type: 1 });
CircleSchema.index({ creator: 1 });

module.exports = mongoose.model('Circle', CircleSchema);