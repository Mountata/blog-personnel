const Circle = require('../models/Circle');
const CircleMember = require('../models/CircleMember');
const CirclePost = require('../models/CirclePost');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
// POST /api/circles — Créer un cercle
// ─────────────────────────────────────────────────────────────
const createCircle = async (req, res) => {
  try {
    const { name, description, type, tags, emoji, customReactions } = req.body;
    const coverImage = req.file ? `/uploads/circles/${req.file.filename}` : '';

    // Générer un token d'invitation unique
    const inviteToken = crypto.randomBytes(16).toString('hex');

    const circle = await Circle.create({
      name,
      description,
      type:            type || 'private',
      tags:            tags ? JSON.parse(tags) : [],
      emoji:           emoji || '⭕',
      customReactions: customReactions ? JSON.parse(customReactions) : [],
      coverImage,
      creator:         req.user._id,
      inviteToken,
      memberCount:     1,
    });

    // Ajouter le créateur comme premier membre avec rôle 'creator'
    await CircleMember.create({
      circle:    circle._id,
      user:      req.user._id,
      role:      'creator',
      status:    'active',
      invitedBy: req.user._id,
      joinedAt:  new Date(),
    });

    const populated = await Circle.findById(circle._id).populate('creator', 'fullName username avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/my — Mes cercles
// ─────────────────────────────────────────────────────────────
const getMyCircles = async (req, res) => {
  try {
    // Trouver tous les cercles où l'utilisateur est membre actif
    const memberships = await CircleMember.find({
      user:   req.user._id,
      status: 'active',
    }).select('circle role');

    const circleIds = memberships.map(m => m.circle);

    const circles = await Circle.find({
      _id:      { $in: circleIds },
      isActive: true,
    }).populate('creator', 'fullName username avatar')
      .sort({ updatedAt: -1 });

    // Ajouter le rôle de l'utilisateur dans chaque cercle
    const circlesWithRole = circles.map(c => {
      const membership = memberships.find(m => m.circle.toString() === c._id.toString());
      return { ...c.toObject(), myRole: membership?.role || 'member' };
    });

    res.json(circlesWithRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/discover — Découvrir les cercles publics
// ─────────────────────────────────────────────────────────────
const discoverCircles = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';

    // Cercles où l'utilisateur est déjà membre
    const myMemberships = await CircleMember.find({ user: req.user._id }).select('circle');
    const myCircleIds   = myMemberships.map(m => m.circle);

    const query = {
      type:     { $in: ['public', 'private'] }, // pas les secrets
      isActive: true,
      _id:      { $nin: myCircleIds },           // pas ceux où je suis déjà
    };

    if (search) {
      query.$text = { $search: search };
    }

    const circles = await Circle.find(query)
      .populate('creator', 'fullName username avatar')
      .sort({ memberCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Circle.countDocuments(query);

    res.json({ circles, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/:id — Détail d'un cercle
// ─────────────────────────────────────────────────────────────
const getCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate('creator', 'fullName username avatar')
      .populate('pinnedPost');

    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    // Vérifier si l'utilisateur est membre
    const membership = await CircleMember.findOne({
      circle: circle._id,
      user:   req.user._id,
    });

    // Un cercle secret n'est accessible qu'aux membres
    if (circle.type === 'secret' && !membership) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({
      ...circle.toObject(),
      myRole:   membership?.role   || null,
      myStatus: membership?.status || null,
      isMember: !!membership && membership.status === 'active',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id — Modifier un cercle (créateur only)
// ─────────────────────────────────────────────────────────────
const updateCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    if (circle.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Seul le créateur peut modifier le cercle' });

    const { name, description, type, tags, emoji, customReactions } = req.body;
    const newCover = req.file ? `/uploads/circles/${req.file.filename}` : null;

    if (name)            circle.name            = name;
    if (description !== undefined) circle.description = description;
    if (type)            circle.type            = type;
    if (tags)            circle.tags            = JSON.parse(tags);
    if (emoji)           circle.emoji           = emoji;
    if (customReactions) circle.customReactions = JSON.parse(customReactions);
    if (newCover)        circle.coverImage      = newCover;

    await circle.save();
    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/circles/:id — Supprimer un cercle (créateur only)
// ─────────────────────────────────────────────────────────────
const deleteCircle = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    if (circle.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Seul le créateur peut supprimer le cercle' });

    // Supprimer tous les membres et posts liés
    await CircleMember.deleteMany({ circle: circle._id });
    await CirclePost.deleteMany({ circle: circle._id });
    await circle.deleteOne();

    res.json({ message: 'Cercle supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/pin/:postId — Épingler un post
// ─────────────────────────────────────────────────────────────
const pinPost = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    // Vérifier que l'utilisateur est créateur ou modérateur
    const membership = await CircleMember.findOne({ circle: circle._id, user: req.user._id });
    if (!membership || !['creator', 'moderator'].includes(membership.role))
      return res.status(403).json({ message: 'Non autorisé' });

    // Désépingler l'ancien post s'il y en a un
    if (circle.pinnedPost) {
      await CirclePost.findByIdAndUpdate(circle.pinnedPost, { isPinned: false });
    }

    circle.pinnedPost = req.params.postId;
    await circle.save();
    await CirclePost.findByIdAndUpdate(req.params.postId, { isPinned: true });

    res.json({ message: 'Post épinglé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/invite/:token — Rejoindre via lien secret
// ─────────────────────────────────────────────────────────────
const joinByInviteToken = async (req, res) => {
  try {
    const circle = await Circle.findOne({ inviteToken: req.params.token, isActive: true });
    if (!circle) return res.status(404).json({ message: 'Lien invalide ou expiré' });

    // Vérifier si déjà membre
    const existing = await CircleMember.findOne({ circle: circle._id, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'Vous êtes déjà membre de ce cercle' });

    await CircleMember.create({
      circle:    circle._id,
      user:      req.user._id,
      role:      'member',
      status:    'active',
      invitedBy: null,
      joinedAt:  new Date(),
    });

    await Circle.findByIdAndUpdate(circle._id, { $inc: { memberCount: 1 } });

    res.json({ message: 'Vous avez rejoint le cercle', circle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/regenerate-token — Nouveau lien secret
// ─────────────────────────────────────────────────────────────
const regenerateInviteToken = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    if (circle.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    circle.inviteToken = crypto.randomBytes(16).toString('hex');
    await circle.save();

    res.json({ inviteToken: circle.inviteToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCircle,
  getMyCircles,
  discoverCircles,
  getCircle,
  updateCircle,
  deleteCircle,
  pinPost,
  joinByInviteToken,
  regenerateInviteToken,
};