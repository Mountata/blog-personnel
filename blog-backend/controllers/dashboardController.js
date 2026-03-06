const Article = require('../models/Article');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const Friendship = require('../models/Friendship');
const CircleMember = require('../models/CircleMember');
const CirclePost = require('../models/CirclePost');

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard — Vue d'ensemble complète
// ─────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();

    // Période : 7 derniers jours
    const last7  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    // Période : 30 derniers jours
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    // Semaine précédente (pour comparaison)
    const prev7  = new Date(now - 14 * 24 * 60 * 60 * 1000);

    // ── 1. Articles de l'utilisateur ────────────────────────
    const myArticles = await Article.find({ author: userId, isDraft: false })
      .select('title views savedBy shares reactions createdAt')
      .sort({ createdAt: -1 });

    // ── 2. Total des vues ────────────────────────────────────
    const totalViews      = myArticles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalViewsLast7 = await Article.aggregate([
      { $match: { author: userId, isDraft: false, createdAt: { $gte: last7 } } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    // ── 3. Abonnés (amis acceptés) ───────────────────────────
    const totalFollowers = await Friendship.countDocuments({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
    });

    // Abonnés gagnés cette semaine
    const followersThisWeek = await Friendship.countDocuments({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
      updatedAt: { $gte: last7 },
    });

    // Abonnés semaine précédente (pour calculer la tendance)
    const followersPrevWeek = await Friendship.countDocuments({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
      updatedAt: { $gte: prev7, $lt: last7 },
    });

    // ── 4. Réactions sur mes articles ────────────────────────
    const myArticleIds = myArticles.map(a => a._id);

    const totalReactions = await Reaction.countDocuments({
      article: { $in: myArticleIds },
    });

    const reactionsThisWeek = await Reaction.countDocuments({
      article:   { $in: myArticleIds },
      createdAt: { $gte: last7 },
    });

    // ── 5. Commentaires sur mes articles ─────────────────────
    const totalComments = await Comment.countDocuments({
      article: { $in: myArticleIds },
    });

    const commentsThisWeek = await Comment.countDocuments({
      article:   { $in: myArticleIds },
      createdAt: { $gte: last7 },
    });

    // ── 6. Taux d'engagement ─────────────────────────────────
    // (réactions + commentaires) / vues * 100
    const engagementRate = totalViews > 0
      ? (((totalReactions + totalComments) / totalViews) * 100).toFixed(1)
      : 0;

    // ── 7. Top 5 articles les plus populaires ────────────────
    const topArticles = [...myArticles]
      .sort((a, b) => (b.views + b.savedBy.length) - (a.views + a.savedBy.length))
      .slice(0, 5)
      .map(a => ({
        _id:      a._id,
        title:    a.title,
        views:    a.views,
        saved:    a.savedBy.length,
        shares:   a.shares || 0,
        date:     a.createdAt,
      }));

    // ── 8. Graphique vues par jour (7 derniers jours) ────────
    const viewsPerDay = await Article.aggregate([
      { $match: { author: userId, isDraft: false } },
      { $project: {
        views: 1,
        // On crée un tableau de dates de vues simulé par jour de publication
        // (pour des vues réelles par jour, il faudrait un modèle ViewLog séparé)
        day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      }},
      { $group: { _id: '$day', views: { $sum: '$views' } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // ── 9. Mes cercles ───────────────────────────────────────
    const myCircles = await CircleMember.countDocuments({
      user:   userId,
      status: 'active',
    });

    // Posts dans mes cercles cette semaine
    const myCircleMemberships = await CircleMember.find({ user: userId, status: 'active' }).select('circle');
    const myCircleIds = myCircleMemberships.map(m => m.circle);

    const circlePostsThisWeek = await CirclePost.countDocuments({
      author:    userId,
      circle:    { $in: myCircleIds },
      createdAt: { $gte: last7 },
    });

    // ── 10. Articles par mois (30 derniers jours) ────────────
    const articlesThisMonth = await Article.countDocuments({
      author:    userId,
      isDraft:   false,
      createdAt: { $gte: last30 },
    });

    // ── Réponse finale ───────────────────────────────────────
    res.json({

      // Chiffres clés (les 4 grandes cartes)
      stats: {
        totalViews,
        viewsThisWeek:    totalViewsLast7[0]?.total || 0,
        totalFollowers,
        followersThisWeek,
        followersTrend:   followersThisWeek - followersPrevWeek, // positif = en hausse
        totalReactions,
        reactionsThisWeek,
        totalComments,
        commentsThisWeek,
        engagementRate,   // en %
        totalArticles:    myArticles.length,
        articlesThisMonth,
        myCircles,
        circlePostsThisWeek,
      },

      // Graphique
      viewsPerDay,

      // Top articles
      topArticles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/dashboard/suggestions — Suggestions intelligentes
// basées sur les cercles et centres d'intérêt
// ─────────────────────────────────────────────────────────────
const getSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Récupérer les tags des cercles de l'utilisateur
    const myMemberships = await CircleMember.find({ user: userId, status: 'active' })
      .populate('circle', 'tags name');

    const myCircleIds = myMemberships.map(m => m.circle._id);
    const myTags = [...new Set(
      myMemberships.flatMap(m => m.circle?.tags || [])
    )];

    // 2. Suggestions de cercles basées sur les tags communs
    const suggestedCircles = myTags.length > 0
      ? await require('../models/Circle').find({
          _id:      { $nin: myCircleIds },
          type:     { $in: ['public', 'private'] },
          isActive: true,
          tags:     { $in: myTags },
        })
        .populate('creator', 'fullName username avatar')
        .sort({ memberCount: -1 })
        .limit(5)
      : [];

    // 3. Suggestions d'amis via membres en commun dans les cercles
    // Trouver tous les membres des mêmes cercles
    const circlemates = await CircleMember.find({
      circle: { $in: myCircleIds },
      user:   { $ne: userId },
      status: 'active',
    }).select('user circle');

    // Compter combien de cercles en commun avec chaque personne
    const commonCirclesMap = {};
    circlemates.forEach(m => {
      const uid = m.user.toString();
      commonCirclesMap[uid] = (commonCirclesMap[uid] || 0) + 1;
    });

    // Exclure les amis existants
    const Friendship = require('../models/Friendship');
    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
    });
    const friendIds = new Set(friendships.map(f =>
      f.requester.toString() === userId.toString() ? f.recipient.toString() : f.requester.toString()
    ));
    friendIds.add(userId.toString());

    // Trier par nombre de cercles en commun
    const suggestedUserIds = Object.entries(commonCirclesMap)
      .filter(([uid]) => !friendIds.has(uid))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([uid]) => uid);

    const User = require('../models/User');
    const suggestedFriends = await User.find({ _id: { $in: suggestedUserIds } })
      .select('fullName username avatar bio isOnline');

    // Ajouter le score de compatibilité
    const suggestedFriendsWithScore = suggestedFriends.map(u => ({
      ...u.toObject(),
      commonCircles: commonCirclesMap[u._id.toString()] || 0,
      compatibilityScore: Math.min(
        Math.round((commonCirclesMap[u._id.toString()] / Math.max(myCircleIds.length, 1)) * 100),
        99
      ),
    }));

    res.json({
      suggestedCircles,
      suggestedFriends: suggestedFriendsWithScore,
      basedOnTags: myTags.slice(0, 5), // tags utilisés pour les suggestions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard, getSuggestions };