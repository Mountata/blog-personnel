const Comment = require('../models/Comment');
const Article = require('../models/Article');
const Notification = require('../models/Notification');

// POST /api/comments/:articleId — Ajouter commentaire
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Commentaire vide' });

    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });
    if (!article.allowComments)
      return res.status(403).json({ message: 'Commentaires désactivés' });

    const comment = await Comment.create({
      article: req.params.articleId,
      author:  req.user._id,
      text
    });

    const populated = await comment.populate('author', 'fullName username avatar');

    // Notification à l'auteur de l'article
    if (article.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: article.author,
        sender:    req.user._id,
        type:      'comment',
        article:   article._id,
        comment:   comment._id
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/comments/:articleId — Voir les commentaires
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.articleId })
      .populate('author', 'fullName username avatar')
      .populate('replies.author', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/comments/:id — Modifier commentaire
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });

    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    comment.text = req.body.text || comment.text;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/comments/:id — Supprimer commentaire
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });

    const article = await Article.findById(comment.article);
    const isAuthor        = comment.author.toString() === req.user._id.toString();
    const isArticleAuthor = article?.author.toString() === req.user._id.toString();

    if (!isAuthor && !isArticleAuthor)
      return res.status(403).json({ message: 'Non autorisé' });

    await comment.deleteOne();
    res.json({ message: 'Commentaire supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/comments/:id/like — Liker un commentaire
const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });

    const isLiked = comment.likes.includes(req.user._id);
    if (isLiked) {
      comment.likes.pull(req.user._id);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.json({ liked: !isLiked, count: comment.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/comments/:id/reply — Répondre à un commentaire
const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Réponse vide' });

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });

    comment.replies.push({ author: req.user._id, text });
    await comment.save();

    const populated = await comment.populate('replies.author', 'fullName username avatar');

    // Notification
    if (comment.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: comment.author,
        sender:    req.user._id,
        type:      'reply',
        comment:   comment._id
      });
    }

    res.status(201).json(populated.replies[populated.replies.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/comments/:id/reply/:replyId — Supprimer une réponse
const deleteReply = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Commentaire non trouvé' });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Réponse non trouvée' });

    if (reply.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    reply.deleteOne();
    await comment.save();
    res.json({ message: 'Réponse supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
  deleteReply
};