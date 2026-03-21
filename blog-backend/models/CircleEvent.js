const mongoose = require('mongoose');

const CircleEventSchema = new mongoose.Schema({

  circle: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  // ─── Infos de l'événement ────────────────────────────────────
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  coverImage:  { type: String, default: '' },

  // ─── Date et lieu ────────────────────────────────────────────
  startDate: { type: Date, required: true },
  endDate:   { type: Date, default: null },
  location:  { type: String, default: '' }, // texte libre ou lien Maps

  // ─── Participants ────────────────────────────────────────────
  // going      = je participe
  // maybe      = peut-être
  // notGoing   = je ne participe pas
  attendees: [{
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['going', 'maybe', 'notGoing'], default: 'going' }
  }],

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

CircleEventSchema.index({ circle: 1, startDate: 1 });

module.exports = mongoose.model('CircleEvent', CircleEventSchema);