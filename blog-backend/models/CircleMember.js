const mongoose = require('mongoose');

const CircleMemberSchema = new mongoose.Schema({

  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  // ─── Rôle du membre ──────────────────────────────────────────
  // creator    = droits complets
  // moderator  = peut gérer membres et posts
  // member     = peut poster et interagir
  role: {
    type:    String,
    enum:    ['creator', 'moderator', 'member'],
    default: 'member'
  },

  // ─── Statut du membre ────────────────────────────────────────
  // active   = membre normal
  // blocked  = ne peut plus écrire (reste visible dans la liste)
  // pending  = invitation envoyée, pas encore acceptée
  status: {
    type:    String,
    enum:    ['active', 'blocked', 'pending'],
    default: 'active'
  },

  // ─── Qui a bloqué ce membre (pour traçabilité) ───────────────
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  blockedAt: { type: Date, default: null },

  // ─── Date d'invitation et par qui ────────────────────────────
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt:  { type: Date, default: Date.now },

}, { timestamps: true });

// Un utilisateur ne peut être qu'une seule fois dans un cercle
CircleMemberSchema.index({ circle: 1, user: 1 }, { unique: true });
CircleMemberSchema.index({ user: 1 });
CircleMemberSchema.index({ circle: 1, status: 1 });

module.exports = mongoose.model('CircleMember', CircleMemberSchema);