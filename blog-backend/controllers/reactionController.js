const Reaction = require('../models/Reaction');
const Article = require('../models/Article');
const Notification = require('../models/Notification');

// POST /api/reactions/:articleId — Réagir à un article
const reactToArticle = async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!validTypes.includes(type))
      return res.status(400).json({ message: 'Type de réaction invalide' });

    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ message: 'Article non trouvé' });

    // Vérifier si déjà réagi
    const existing = await Reaction.findOne({
      user:    req.user._id,
      article: req.params.articleId
    });

    if (existing) {
      if (existing.type === type) {
        // Même réaction = supprimer (toggle)
        await existing.deleteOne();

        const reactions = await getReactionsSummary(req.params.articleId);
        return res.json({ reacted: false, reactions });
      } else {
        // Changer la réaction
        existing.type = type;
        await existing.save();

        const reactions = await getReactionsSummary(req.params.articleId);
        return res.json({ reacted: true, type, reactions });
      }
    }

    // Nouvelle réaction
    await Reaction.create({
      user:    req.user._id,
      article: req.params.articleId,
      type
    });

    // Notification à l'auteur
    if (article.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: article.author,
        sender:    req.user._id,
        type,
        article:   article._id
      });
    }

    const reactions = await getReactionsSummary(req.params.articleId);
    res.status(201).json({ reacted: true, type, reactions });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reactions/:articleId — Voir les réactions
const getReactions = async (req, res) => {
  try {
    const reactions = await getReactionsSummary(req.params.articleId);

    // Réaction de l'utilisateur connecté
    const myReaction = await Reaction.findOne({
      user:    req.user._id,
      article: req.params.articleId
    });

    res.json({
      reactions,
      myReaction: myReaction ? myReaction.type : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reactions/:articleId/list — Liste des gens qui ont réagi
const getReactionsList = async (req, res) => {
  try {
    const reactions = await Reaction.find({ article: req.params.articleId })
      .populate('user', 'fullName username avatar');

    res.json(reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper — Résumé des réactions
const getReactionsSummary = async (articleId) => {
  const reactions = await Reaction.find({ article: articleId });

  const summary = {
    total: reactions.length,
    like:  0,
    love:  0,
    haha:  0,
    wow:   0,
    sad:   0,
    angry: 0
  };

  reactions.forEach(r => { summary[r.type]++ });
  return summary;
};

module.exports = { reactToArticle, getReactions, getReactionsList };