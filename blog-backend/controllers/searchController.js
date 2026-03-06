const User = require('../models/User');
const Article = require('../models/Article');

// GET /api/search?q=query — Recherche globale
const search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '')
      return res.status(400).json({ message: 'Terme de recherche vide' });

    const regex = new RegExp(q, 'i');

    // Recherche utilisateurs
    const users = await User.find({
      $or: [
        { username: regex },
        { fullName: regex }
      ]
    })
    .select('fullName username avatar isOnline')
    .limit(10);

    // Recherche articles publics
    const articles = await Article.find({
      $or: [
        { title:   regex },
        { content: regex },
        { tags:    regex }
      ],
      isPublic: true,
      isDraft:  false
    })
    .populate('author', 'fullName username avatar')
    .limit(10);

    res.json({ users, articles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/search/users?q=query — Recherche uniquement utilisateurs
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Terme de recherche vide' });

    const regex = new RegExp(q, 'i');

    const users = await User.find({
      $or: [
        { username: regex },
        { fullName: regex }
      ],
      _id: { $ne: req.user._id } // Exclure soi-même
    })
    .select('fullName username avatar isOnline bio')
    .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/search/articles?q=query — Recherche uniquement articles
const searchArticles = async (req, res) => {
  try {
    const { q, tag } = req.query;

    let query = { isPublic: true, isDraft: false };

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { title:   regex },
        { content: regex },
        { tags:    regex }
      ];
    }

    if (tag) {
      query.tags = new RegExp(tag, 'i');
    }

    const articles = await Article.find(query)
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { search, searchUsers, searchArticles };