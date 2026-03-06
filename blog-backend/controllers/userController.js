const User = require('../models/User');
const Article = require('../models/Article');

// GET /api/users/:id — Voir un profil
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -blockedUsers');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/profile — Modifier son profil
const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, email } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (bio)      user.bio      = bio;
    if (email)    user.email    = email;

    await user.save();

    res.json({
      _id:      user._id,
      fullName: user.fullName,
      username: user.username,
      email:    user.email,
      avatar:   user.avatar,
      bio:      user.bio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/avatar — Changer photo de profil
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });

    const avatar = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select('-password');

    res.json({ avatar: user.avatar, message: 'Photo de profil mise à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/cover — Changer photo de couverture
const updateCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });

    const coverPhoto = `/uploads/covers/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { coverPhoto },
      { new: true }
    ).select('-password');

    res.json({ coverPhoto: user.coverPhoto, message: 'Photo de couverture mise à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/password — Changer mot de passe
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id/articles — Articles publics d'un utilisateur
const getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      author: req.params.id,
      isPublic: true,
      isDraft: false
    })
    .populate('author', 'fullName username avatar')
    .sort({ createdAt: -1 });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/delete — Supprimer son compte
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    await Article.deleteMany({ author: req.user._id });
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  updatePassword,
  getUserArticles,
  deleteAccount
};