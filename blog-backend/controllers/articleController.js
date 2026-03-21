const Article    = require('../models/Article');
const Comment    = require('../models/Comment');
const Reaction   = require('../models/Reaction');
const Friendship = require('../models/Friendship');

const createArticle = async (req, res) => {
  try {
    const { title, content, tags, isPublic, allowComments, isDraft, videoUrl } = req.body;
    const imageFiles = req.files?.images || [];
    const images     = imageFiles.map(f => `/uploads/articles/${f.filename}`);
    const videoFile  = req.files?.video?.[0] || null;
    const video      = videoFile ? `/uploads/videos/${videoFile.filename}` : '';
    let videoType    = '';
    if (video)                 videoType = 'upload';
    else if (videoUrl?.trim()) videoType = 'url';

    const article = await Article.create({
      author:        req.user._id,
      title,
      content,
      tags:          tags          ? JSON.parse(tags) : [],
      isPublic:      isPublic      === 'true',
      allowComments: allowComments !== 'false',
      isDraft:       isDraft       === 'true',
      images,
      coverImage:    images[0] || '',
      video,
      videoUrl:      videoUrl?.trim() || '',
      videoType,
    });

    const populated = await article.populate(
      'author', 'fullName username avatar jobTitle availability'
    );
    res.status(201).json({ ...populated.toObject(), commentsCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Helper pour enrichir les articles avec les compteurs
const enrichArticles = async (articles) => {
  if (!articles.length) return [];

  const articleIds = articles.map(a => a._id || a);

  const [commentCounts, reactionCounts] = await Promise.all([
    Comment.aggregate([
      { $match: { article: { $in: articleIds } } },
      { $group: { _id: '$article', count: { $sum: 1 } } },
    ]),
    Reaction.aggregate([
      { $match: { article: { $in: articleIds } } },
      { $group: { _id: '$article', count: { $sum: 1 } } },
    ]),
  ]);

  return articles.map(a => {
    const obj = a.toObject ? a.toObject() : a;
    const commentCount  = commentCounts.find(
      c => c._id.toString() === obj._id.toString()
    );
    const reactionCount = reactionCounts.find(
      r => r._id.toString() === obj._id.toString()
    );
    return {
      ...obj,
      commentsCount:  commentCount?.count  || 0,
      reactionsCount: reactionCount?.count || 0,
    };
  });
};

const getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 10;

    const friendships = await Friendship.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    });

    const friendIds  = friendships.map(f =>
      f.requester.toString() === req.user._id.toString()
        ? f.recipient : f.requester
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

    // ✅ Enrichir avec commentsCount et reactionsCount
    const enriched = await enrichArticles(articles);

    res.json({
      articles:    enriched,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.user._id })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 });

    // ✅ Enrichir aussi mes articles
    const enriched = await enrichArticles(articles);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      author:   req.params.userId,
      isDraft:  false,
      isPublic: true,
    })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 });

    // ✅ Enrichir aussi les articles d'un user
    const enriched = await enrichArticles(articles);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'fullName username avatar jobTitle availability');
    if (!article)
      return res.status(404).json({ message: 'Article non trouvé' });

    const alreadyViewed = article.viewedBy?.some(
      id => id.toString() === req.user._id.toString()
    );
    if (!alreadyViewed) {
      article.views += 1;
      article.viewedBy.push(req.user._id);
      await article.save();
    }

    // ✅ Enrichir l'article individuel aussi
    const [enriched] = await enrichArticles([article]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article)
      return res.status(404).json({ message: 'Article non trouvé' });
    if (article.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    const { title, content, tags, isPublic, allowComments, isDraft, videoUrl } = req.body;
    const imageFiles = req.files?.images || [];
    const newImages  = imageFiles.map(f => `/uploads/articles/${f.filename}`);
    const videoFile  = req.files?.video?.[0] || null;
    const newVideo   = videoFile ? `/uploads/videos/${videoFile.filename}` : '';

    if (title)   article.title   = title;
    if (content) article.content = content;
    if (tags)    article.tags    = JSON.parse(tags);
    if (isPublic      !== undefined) article.isPublic      = isPublic === 'true';
    if (allowComments !== undefined) article.allowComments = allowComments !== 'false';
    if (isDraft       !== undefined) article.isDraft       = isDraft === 'true';
    if (newImages.length > 0) {
      article.images     = newImages;
      article.coverImage = newImages[0];
    }
    if (newVideo) {
      article.video     = newVideo;
      article.videoType = 'upload';
    } else if (videoUrl?.trim()) {
      article.videoUrl  = videoUrl.trim();
      article.videoType = 'url';
    }

    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article)
      return res.status(404).json({ message: 'Article non trouvé' });
    if (article.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });
    await article.deleteOne();
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const saveArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article)
      return res.status(404).json({ message: 'Article non trouvé' });
    const isSaved = article.savedBy?.some(
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

const trackView = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    const alreadyViewed = article.viewedBy?.some(
      id => id.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      article.views += 1;
      article.viewedBy.push(req.user._id);
      await article.save();
    }

    res.json({ views: article.views });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createArticle,
  getFeed,
  getMyArticles,
  getUserArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  saveArticle,
  trackView,
};