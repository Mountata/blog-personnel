const User           = require('../models/User');
const ProfileComment = require('../models/ProfileComment');
const Notification   = require('../models/Notification');
const Article        = require('../models/Article');

// GET /api/profile/:userId
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -email -blockedUsers')
      .lean();

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Agrégats articles
    const [totalArticles, viewsAgg, savedAgg] = await Promise.all([
      Article.countDocuments({ author: user._id, isDraft: false }),
      Article.aggregate([
        { $match: { author: user._id, isDraft: false } },
        { $group: { _id: null, total: { $sum: '$views' } } },
      ]),
      Article.aggregate([
        { $match: { author: user._id, isDraft: false } },
        { $group: { _id: null, total: { $sum: { $size: '$savedBy' } } } },
      ]),
    ]);

    const comments = await ProfileComment.find({ recipient: user._id })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const isLiked = user.profileLikes?.some(
      id => id.toString() === req.user._id.toString()
    );

    res.json({
      ...user,
      stats: {
        totalArticles,
        totalViews:        viewsAgg[0]?.total || 0,
        totalSaved:        savedAgg[0]?.total || 0,
        profileLikesCount: user.profileLikes?.length || 0,
        isLiked,
      },
      comments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const {
      fullName, bio, jobTitle, location, website, currentGoal,
      availability, yearsExp, totalProjects, skills, languages, achievements,
    } = req.body;

    const updates = {};
    if (fullName      != null) updates.fullName      = fullName;
    if (bio           != null) updates.bio           = bio;
    if (jobTitle      != null) updates.jobTitle      = jobTitle;
    if (location      != null) updates.location      = location;
    if (website       != null) updates.website       = website;
    if (currentGoal   != null) updates.currentGoal   = currentGoal;
    if (availability  != null) updates.availability  = availability;
    if (yearsExp      != null) updates.yearsExp      = Number(yearsExp);
    if (totalProjects != null) updates.totalProjects = Number(totalProjects);

    try { if (skills)       updates.skills       = JSON.parse(skills);       } catch (_) {}
    try { if (languages)    updates.languages    = JSON.parse(languages);    } catch (_) {}
    try { if (achievements) updates.achievements = JSON.parse(achievements); } catch (_) {}

    if (req.files?.avatar?.[0])
      updates.avatar     = `/uploads/avatars/${req.files.avatar[0].filename}`;
    if (req.files?.coverPhoto?.[0])
      updates.coverPhoto = `/uploads/covers/${req.files.coverPhoto[0].filename}`;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profile/:userId/like
const toggleProfileLike = async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (target._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Impossible de liker votre propre profil' });

    const liked = target.profileLikes.some(
      id => id.toString() === req.user._id.toString()
    );

    if (liked) {
      target.profileLikes.pull(req.user._id);
    } else {
      target.profileLikes.push(req.user._id);
      await Notification.create({
        recipient: target._id,
        sender:    req.user._id,
        type:      'profile_like',
        message:   'a aimé votre profil',
        link:      `/profile/${req.user._id}`,
      });
    }

    await target.save();
    res.json({ liked: !liked, count: target.profileLikes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profile/:userId/comments
const addProfileComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Contenu vide' });

    const comment = await ProfileComment.create({
      recipient: req.params.userId,
      author:    req.user._id,
      content:   content.trim(),
    });

    const populated = await comment.populate('author', 'fullName username avatar');

    if (req.params.userId !== req.user._id.toString()) {
      await Notification.create({
        recipient: req.params.userId,
        sender:    req.user._id,
        type:      'profile_comment',
        message:   'a commenté votre profil',
        link:      `/profile/${req.params.userId}`,
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/profile/:userId/comments/:commentId
const deleteProfileComment = async (req, res) => {
  try {
    const comment = await ProfileComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });

    const isAuthor = comment.author.toString()    === req.user._id.toString();
    const isOwner  = comment.recipient.toString() === req.user._id.toString();

    if (!isAuthor && !isOwner)
      return res.status(403).json({ message: 'Non autorisé' });

    await comment.deleteOne();
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/profile/:userId/recommend
const recommendProfile = async (req, res) => {
  try {
    const { friendIds } = req.body;
    if (!friendIds?.length) return res.status(400).json({ message: 'Aucun ami sélectionné' });

    const target = await User.findById(req.params.userId).select('fullName');
    if (!target) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    await Notification.insertMany(
      friendIds.map(fid => ({
        recipient: fid,
        sender:    req.user._id,
        type:      'profile_recommendation',
        message:   `pense que vous devriez voir le profil de ${target.fullName}`,
        link:      `/profile/${req.params.userId}`,
      }))
    );

    res.json({ message: `Recommandé à ${friendIds.length} ami(s)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProfile, updateProfile,
  toggleProfileLike,
  addProfileComment, deleteProfileComment,
  recommendProfile,
};