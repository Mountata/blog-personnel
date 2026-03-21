const User    = require('../models/User');
const jwt     = require('jsonwebtoken');
const sendEmail        = require('../utils/sendEmail');
const otpEmailTemplate = require('../utils/otpEmailTemplate');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const otpStore = new Map();

const getType = (str) => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return 'email';
  if (/^\+?\d{7,15}$/.test(str.replace(/\s/g, ''))) return 'phone';
  return 'username';
};

const register = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    if (!fullName || !username || !email || !password)
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username déjà utilisé' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email déjà utilisé' });
    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : '';
    const user = await User.create({ fullName, username, email, password, avatar: avatarPath });
    res.status(201).json({
      _id: user._id, fullName: user.fullName, username: user.username,
      email: user.email, avatar: user.avatar, token: generateToken(user._id),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const login = async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.username;
    const { password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: 'Identifiant et mot de passe requis' });
    const type = getType(identifier);
    let user;
    if (type === 'email') user = await User.findOne({ email:    identifier.toLowerCase() });
    else                  user = await User.findOne({ username: identifier.toLowerCase() });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    user.isOnline = true;
    await user.save();
    res.json({
      _id: user._id, fullName: user.fullName, username: user.username,
      email: user.email, avatar: user.avatar, token: generateToken(user._id),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, lastSeen: Date.now() });
    res.json({ message: 'Déconnecté avec succès' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'Email requis' });
    if (getType(identifier) !== 'email')
      return res.status(400).json({ message: 'Entrez une adresse email valide' });
    const user = await User.findOne({ email: identifier.toLowerCase() });
    if (!user) return res.json({ message: 'Si ce compte existe, un code a été envoyé.' });
    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(identifier.toLowerCase(), { otp, expiresAt, verified: false });
    await sendEmail({
      to:      identifier,
      subject: "🔐 Code de vérification - Your'Blog",
      html:    otpEmailTemplate(otp),
    });
    res.json({ message: 'Code envoyé avec succès.' });
  } catch (err) {
    console.error('[forgotPassword]', err.message);
    res.status(500).json({ message: "Erreur d'envoi email. Vérifiez votre config Gmail." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const record = otpStore.get(identifier?.toLowerCase());
    if (!record) return res.status(400).json({ message: 'Aucun code trouvé. Recommencez.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(identifier.toLowerCase());
      return res.status(400).json({ message: 'Code expiré.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Code incorrect.' });
    record.verified = true;
    res.json({ message: 'Code vérifié avec succès.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    const record = otpStore.get(identifier?.toLowerCase());
    if (!record || !record.verified || record.otp !== otp)
      return res.status(400).json({ message: 'Session invalide. Recommencez.' });
    if (Date.now() > record.expiresAt)
      return res.status(400).json({ message: 'Session expirée.' });
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Mot de passe trop court (min 6 caractères)' });
    const user = await User.findOne({ email: identifier.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    user.password = newPassword;
    await user.save();
    otpStore.delete(identifier.toLowerCase());
    res.json({ message: 'Mot de passe réinitialisé avec succès !' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { register, login, logout, getMe, forgotPassword, verifyOtp, resetPassword };