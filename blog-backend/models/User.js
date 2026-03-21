const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  username:     { type: String, required: true, unique: true, lowercase: true },
  email:        { type: String, unique: true, sparse: true, lowercase: true },
  phone:    { type: String, unique: true, sparse: true },
  password:     { type: String, required: true },
  avatar:       { type: String, default: '' },
  coverPhoto:   { type: String, default: '' },
  bio:          { type: String, default: '', maxlength: 500 },
  jobTitle:     { type: String, default: '', maxlength: 100 },
  location:     { type: String, default: '', maxlength: 100 },
  website:      { type: String, default: '' },
  currentGoal:  { type: String, default: '', maxlength: 200 },
  availability: {
    type:    String,
    enum:    ['open', 'freelance', 'unavailable'],
    default: 'unavailable',
  },
  yearsExp:      { type: Number, default: 0 },
  totalProjects: { type: Number, default: 0 },
  skills:        [{ type: String, maxlength: 50 }],
  languages:     [{ type: String, maxlength: 50 }],
  achievements: [{
    title:       { type: String, required: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 300 },
    link:        { type: String, default: '' },
    icon:        { type: String, default: '🏆' },
  }],
  profileLikes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isOnline:           { type: Boolean, default: false },
  lastSeen:           { type: Date, default: Date.now },
  blockedUsers:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ignoredSuggestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);