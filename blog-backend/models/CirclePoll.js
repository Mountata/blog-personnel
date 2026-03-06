const mongoose = require('mongoose');

const CirclePollSchema = new mongoose.Schema({

  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  // ─── Question du sondage ─────────────────────────────────────
  question: { type: String, required: true },

  // ─── Options de réponse ──────────────────────────────────────
  // Chaque option garde la liste des votants
  options: [{
    text:    { type: String, required: true },
    voters:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],

  // ─── Paramètres ──────────────────────────────────────────────
  // Un seul vote ou plusieurs choix possibles
  multipleChoice: { type: Boolean, default: false },

  // Date de fin du sondage (null = pas de limite)
  expiresAt: { type: Date, default: null },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

CirclePollSchema.index({ circle: 1 });

module.exports = mongoose.model('CirclePoll', CirclePollSchema);