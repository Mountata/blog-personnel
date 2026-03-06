const Article      = require('../models/Article');
const Notification = require('../models/Notification');
const Friendship   = require('../models/Friendship');

// POST /api/articles
const createArticle = async (req, res) => {
  try {
    const { title, content, tags, isPublic, allowComments, isDraft } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/articles/${f.filename}`) : [];

    const article = await Article.create({
      author: req.user._id,
      title, content,
      tags:          tags          ? JSON.parse(tags) : [],
      isPublic:      isPublic      === 'true',
      allowComments: allowComments !== 'false',
      isDraft:       isDraft       === 'true',
      images,
      coverImage: images[0] || '',
    });

    const populated = await article.populate('author', 'fullName username avatar jobTitle availability');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/articles/feed  — avec pagination correcte
const getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 10;

    const friendships = await Friendship.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    });

    const friendIds  = friendships.map(f =>
      f.requester.toString() === req.user._id.toString() ? f.recipient : f.requester
    );
    const blockedIds = req.user.blockedUsers || [];

    const query = {
      $or: [
        { author: req.user._id },
        { author: { $in: friendIds, $nin: blockedIds }, isPublic: true },
      ],
      isDraft: false,
    };

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('author', 'fullName username avatar isOnline jobTitle availability')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Article.countDocuments(query),
    ]);

    res.json({
      articles,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/articles/my
const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/articles/user/:userId — articles publics d'un utilisateur
const getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      author:   req.params.userId,
      isDraft:  false,
      isPublic: true,
    })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/articles/:id — incrémente les vues UNE SEULE FOIS par user
const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'fullName username avatar jobTitle availability');

    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    const alreadyViewed = article.viewedBy.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      article.views += 1;
      article.viewedBy.push(req.user._id);
      await article.save();
    }

    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/articles/:id
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });
    if (article.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    const { title, content, tags, isPublic, allowComments, isDraft } = req.body;
    const newImages = req.files ? req.files.map(f => `/uploads/articles/${f.filename}`) : [];

    article.title         = title         || article.title;
    article.content       = content       || article.content;
    article.tags          = tags          ? JSON.parse(tags) : article.tags;
    article.isPublic      = isPublic      !== undefined ? isPublic === 'true'       : article.isPublic;
    article.allowComments = allowComments !== undefined ? allowComments !== 'false' : article.allowComments;
    article.isDraft       = isDraft       !== undefined ? isDraft === 'true'        : article.isDraft;
    if (newImages.length > 0) article.images = newImages;

    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/articles/:id
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });
    if (article.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    await article.deleteOne();
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/articles/:id/save
const saveArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    const isSaved = article.savedBy.some(
      id => id.toString() === req.user._id.toString()
    );

    if (isSaved) article.savedBy.pull(req.user._id);
    else         article.savedBy.push(req.user._id);

    await article.save();
    res.json({ saved: !isSaved, count: article.savedBy.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createArticle, getFeed, getMyArticles, getUserArticles,
  getArticle, updateArticle, deleteArticle, saveArticle,
};