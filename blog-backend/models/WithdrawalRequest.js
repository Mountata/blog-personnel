const mongoose = require('mongoose');

const WithdrawalRequestSchema = new mongoose.Schema({

  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },

  // Le membre qui veut quitter
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Statut de la demande ────────────────────────────────────
  // pending   = en attente de validation
  // approved  = retrait validé
  // auto      = retrait automatique après 7 jours sans réponse
  status: {
    type:    String,
    enum:    ['pending', 'approved', 'auto'],
    default: 'pending'
  },

  // ─── Validateurs ─────────────────────────────────────────────
  // Liste des membres qui ont voté pour approuver le retrait
  // 1 créateur OU 1 modérateur OU 3 membres simples = retrait accepté
  approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Qui a finalement validé (admin/modo) ou 'auto' si automatique
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt:  { type: Date, default: null },

  // ─── Expiration automatique ──────────────────────────────────
  // Si personne ne répond en 7 jours → retrait automatique
  expiresAt: {
    type:    Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 jours
  },

  // Message optionnel du membre qui veut partir
  reason: { type: String, default: '' },

}, { timestamps: true });

// Un seul retrait en cours par membre par cercle
WithdrawalRequestSchema.index({ circle: 1, requester: 1 }, { unique: true });

// Index pour le job automatique qui vérifie les expirations
WithdrawalRequestSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);