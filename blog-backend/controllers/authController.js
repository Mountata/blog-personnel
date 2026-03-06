const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    
    const { fullName, username, email, password } = req.body;

    if (await User.findOne({ username }))
      return res.status(400).json({ message: "Username déjà utilisé" });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email déjà utilisé" });

    const user = await User.create({ fullName, username, email, password });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Username ou mot de passe incorrect" });

    user.isOnline = true;
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: Date.now()
    });
    res.json({ message: "Déconnecté avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, logout, getMe };