const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);