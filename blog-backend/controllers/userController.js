const User         = require('../models/User');
const Article      = require('../models/Article');
const Friendship   = require('../models/Friendship');
const CircleMember = require('../models/CircleMember');
const Circle       = require('../models/Circle');
const Comment      = require('../models/Comment');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -blockedUsers');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, email } = req.body;
    const user = await User.findById(req.user._id);
    if (fullName) user.fullName = fullName;
    if (bio)      user.bio      = bio;
    if (email)    user.email    = email;
    await user.save();
    res.json({ _id: user._id, fullName: user.fullName, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });
    const avatar = `/uploads/avatars/${req.file.filename}`;
    const user   = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true }).select('-password');
    res.json({ avatar: user.avatar, message: 'Photo de profil mise à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCover = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });
    const coverPhoto = `/uploads/covers/${req.file.filename}`;
    const user       = await User.findByIdAndUpdate(req.user._id, { coverPhoto }, { new: true }).select('-password');
    res.json({ coverPhoto: user.coverPhoto, message: 'Photo de couverture mise à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({ author: req.params.id, isPublic: true, isDraft: false })
      .populate('author', 'fullName username avatar')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    await Article.deleteMany({ author: req.user._id });
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFriendSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const page   = parseInt(req.query.page) || 1;
    const limit  = 10;

    const [myFriendships, pendingFriendships] = await Promise.all([
      Friendship.find({ $or: [{ requester: userId, status: 'accepted' }, { recipient: userId, status: 'accepted' }] }),
      Friendship.find({ $or: [{ requester: userId }, { recipient: userId }], status: 'pending' }),
    ]);

    const myFriendIds = myFriendships.map(f =>
      f.requester.toString() === userId.toString() ? f.recipient.toString() : f.requester.toString()
    );
    const pendingIds  = pendingFriendships.map(f =>
      f.requester.toString() === userId.toString() ? f.recipient.toString() : f.requester.toString()
    );
    const ignoredIds  = (req.user.ignoredSuggestions || []).map(id => id.toString());
    const blockedIds  = (req.user.blockedUsers        || []).map(id => id.toString());

    const excludeSet = new Set([userId.toString(), ...myFriendIds, ...pendingIds, ...ignoredIds, ...blockedIds]);

    const scoreMap = {};
    const addScore = (candidateId, points, reason, detail = null) => {
      const id = candidateId.toString();
      if (excludeSet.has(id)) return;
      if (!scoreMap[id]) scoreMap[id] = { score: 0, reasons: new Set(), details: {} };
      scoreMap[id].score += points;
      scoreMap[id].reasons.add(reason);
      if (detail !== null) scoreMap[id].details[reason] = detail;
    };

    // Niveau 1 : amis en commun
    if (myFriendIds.length > 0) {
      const fof = await Friendship.find({
        $or: [{ requester: { $in: myFriendIds }, status: 'accepted' }, { recipient: { $in: myFriendIds }, status: 'accepted' }],
      });
      const mutualCount = {};
      fof.forEach(f => {
        [f.requester.toString(), f.recipient.toString()].forEach(id => {
          if (!myFriendIds.includes(id) && !excludeSet.has(id)) mutualCount[id] = (mutualCount[id] || 0) + 1;
        });
      });
      Object.entries(mutualCount).forEach(([id, count]) => addScore(id, count * 10, 'mutual', count));
    }

    // Niveau 1b : même cercle
    const myCircles    = await CircleMember.find({ user: userId, status: 'active' }).select('circle');
    const myCircleIds  = myCircles.map(m => m.circle.toString());
    if (myCircleIds.length > 0) {
      const sameCircleMembers = await CircleMember.find({
        circle: { $in: myCircleIds }, user: { $nin: [...excludeSet] }, status: 'active',
      }).populate('circle', 'name emoji tags');
      const circleMap = {};
      sameCircleMembers.forEach(m => {
        const uid = m.user.toString();
        if (!circleMap[uid]) circleMap[uid] = { count: 0, names: [] };
        circleMap[uid].count += 1;
        if (m.circle) circleMap[uid].names.push(`${m.circle.emoji || '⭕'} ${m.circle.name}`);
      });
      Object.entries(circleMap).forEach(([id, { count, names }]) => addScore(id, count * 15, 'circle', names.slice(0, 2)));

      const myCircleData = await Circle.find({ _id: { $in: myCircleIds } }).select('tags');
      const myTags = [...new Set(myCircleData.flatMap(c => c.tags))];
      if (myTags.length > 0) {
        const tagCircles = await Circle.find({ tags: { $in: myTags }, _id: { $nin: myCircleIds } }).select('_id tags');
        if (tagCircles.length > 0) {
          const tagMembers = await CircleMember.find({
            circle: { $in: tagCircles.map(c => c._id) }, user: { $nin: [...excludeSet] }, status: 'active',
          }).populate('circle', 'tags');
          tagMembers.forEach(m => {
            const commonTags = (m.circle?.tags || []).filter(t => myTags.includes(t));
            if (commonTags.length > 0) addScore(m.user, commonTags.length * 6, 'tags', commonTags.slice(0, 3));
          });
        }
      }
    }

    // Niveau 2 : localisation
    if (req.user.location) {
      const parts   = req.user.location.split(',').map(s => s.trim());
      const city    = parts[0];
      const country = parts[parts.length - 1];
      if (parts.length > 1) {
        const zone = await User.find({ _id: { $nin: [...excludeSet] }, location: { $regex: parts[1], $options: 'i' } }).select('_id').limit(50);
        zone.forEach(u => addScore(u._id, 12, 'zone', parts[1]));
      }
      const cityUsers = await User.find({ _id: { $nin: [...excludeSet] }, location: { $regex: city, $options: 'i' } }).select('_id').limit(80);
      cityUsers.forEach(u => addScore(u._id, 8, 'city', city));
      if (country && country !== city) {
        const countryUsers = await User.find({ _id: { $nin: [...excludeSet] }, location: { $regex: country, $options: 'i' } }).select('_id').limit(100);
        countryUsers.forEach(u => addScore(u._id, 2, 'country', country));
      }
    }

    // Niveau 2 : métier
    if (req.user.jobTitle?.trim()) {
      const keyword  = req.user.jobTitle.trim().split(' ')[0];
      const jobUsers = await User.find({ _id: { $nin: [...excludeSet] }, jobTitle: { $regex: keyword, $options: 'i' } }).select('_id jobTitle').limit(60);
      jobUsers.forEach(u => addScore(u._id, 7, 'job', u.jobTitle));
    }

    // Niveau 2 : compétences
    if (req.user.skills?.length > 0) {
      const skillUsers = await User.find({ _id: { $nin: [...excludeSet] }, skills: { $in: req.user.skills } }).select('_id skills').limit(100);
      skillUsers.forEach(u => {
        const common = u.skills.filter(s => req.user.skills.includes(s));
        if (common.length > 0) addScore(u._id, common.length * 5, 'skills', common.slice(0, 3));
      });
    }

    // Niveau 2 : langues
    if (req.user.languages?.length > 0) {
      const langUsers = await User.find({ _id: { $nin: [...excludeSet] }, languages: { $in: req.user.languages } }).select('_id languages').limit(80);
      langUsers.forEach(u => {
        const common = u.languages.filter(l => req.user.languages.includes(l));
        if (common.length > 0) addScore(u._id, common.length * 2, 'language', common);
      });
    }

    // Niveau 2 : expérience
    if (req.user.yearsExp > 0) {
      const expUsers = await User.find({ _id: { $nin: [...excludeSet] }, yearsExp: { $gte: Math.max(0, req.user.yearsExp - 2), $lte: req.user.yearsExp + 2 } }).select('_id yearsExp').limit(60);
      expUsers.forEach(u => addScore(u._id, 3, 'experience', `${u.yearsExp} ans`));
    }

    // Niveau 3 : articles
    const savedArticles = await Article.find({ savedBy: userId }).select('_id savedBy').limit(20);
    savedArticles.forEach(a => a.savedBy.forEach(uid => { if (!excludeSet.has(uid.toString())) addScore(uid, 4, 'article_like'); }));

    const myComments = await Comment.find({ author: userId }).select('article').limit(20);
    if (myComments.length > 0) {
      const artIds = myComments.map(c => c.article);
      const otherCommenters = await Comment.find({ article: { $in: artIds }, author: { $nin: [...excludeSet] } }).select('author').limit(100);
      otherCommenters.forEach(c => addScore(c.author, 4, 'article_comment'));
    }

    const profileLikers = await User.find({ profileLikes: userId }).select('_id').limit(50);
    profileLikers.forEach(u => addScore(u._id, 3, 'profile_like'));

    if (['open', 'freelance'].includes(req.user.availability)) {
      const availUsers = await User.find({ _id: { $nin: [...excludeSet] }, availability: { $in: ['open', 'freelance'] } }).select('_id availability').limit(60);
      availUsers.forEach(u => addScore(u._id, 2, 'available', u.availability));
    }

    const recentUsers  = await User.find({ _id: { $nin: [...excludeSet] }, lastSeen: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).select('_id').limit(80);
    recentUsers.forEach(u => addScore(u._id, 3, 'active'));

    const onlineUsers  = await User.find({ _id: { $nin: [...excludeSet] }, isOnline: true }).select('_id').limit(50);
    onlineUsers.forEach(u => addScore(u._id, 2, 'online'));

    const completeUsers = await User.find({ _id: { $nin: [...excludeSet] }, avatar: { $ne: '' }, bio: { $ne: '' } }).select('_id').limit(100);
    completeUsers.forEach(u => addScore(u._id, 1, 'complete'));

    const newUsers = await User.find({ _id: { $nin: [...excludeSet] }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }).select('_id').limit(100);
    newUsers.forEach(u => addScore(u._id, 1, 'new'));

    if (Object.keys(scoreMap).length === 0) {
      const everyone = await User.find({ _id: { $nin: [...excludeSet] } }).select('_id').limit(100);
      everyone.forEach(u => addScore(u._id, 1, 'discover'));
    }

    const sorted    = Object.entries(scoreMap).sort(([, a], [, b]) => b.score - a.score);
    const total     = sorted.length;
    const paginated = sorted.slice((page - 1) * limit, page * limit);
    const ids       = paginated.map(([id]) => id);

    const users = await User.find({ _id: { $in: ids } })
      .select('fullName username avatar jobTitle location skills languages yearsExp isOnline lastSeen createdAt availability bio');

    const REASON_CONFIG = {
      mutual:          { emoji: '👥', label: (d) => `${d} ami${d > 1 ? 's' : ''} en commun`, priority: 1 },
      circle:          { emoji: '⭕', label: (d) => `Dans ${Array.isArray(d) ? d[0] : d}`,    priority: 2 },
      tags:            { emoji: '🏷️', label: (d) => `Tags: ${Array.isArray(d) ? d.join(', ') : d}`, priority: 3 },
      zone:            { emoji: '📍', label: (d) => `Même quartier: ${d}`,                    priority: 4 },
      city:            { emoji: '🏙️', label: (d) => `Même ville: ${d}`,                      priority: 5 },
      country:         { emoji: '🌍', label: (d) => `Même pays: ${d}`,                        priority: 6 },
      job:             { emoji: '💼', label: (d) => `Même domaine: ${d}`,                     priority: 7 },
      skills:          { emoji: '🛠️', label: (d) => `Skills: ${Array.isArray(d) ? d.join(', ') : d}`, priority: 8 },
      language:        { emoji: '🗣️', label: (d) => `Parle: ${Array.isArray(d) ? d.join(', ') : d}`, priority: 9 },
      experience:      { emoji: '📈', label: (d) => d,                                         priority: 10 },
      article_like:    { emoji: '❤️', label: () => 'Aime les mêmes articles',                 priority: 11 },
      article_comment: { emoji: '💬', label: () => 'Commente les mêmes articles',             priority: 12 },
      profile_like:    { emoji: '👏', label: () => 'Interactions communes',                   priority: 13 },
      available:       { emoji: '🟢', label: (d) => d === 'open' ? 'Ouvert aux collaborations' : 'Freelance dispo', priority: 14 },
      online:          { emoji: '🔵', label: () => 'En ligne maintenant',                     priority: 15 },
      active:          { emoji: '⚡', label: () => 'Actif cette semaine',                     priority: 16 },
      complete:        { emoji: '✅', label: () => 'Profil complet',                          priority: 17 },
      new:             { emoji: '✨', label: () => 'Nouveau membre',                          priority: 18 },
      discover:        { emoji: '🌐', label: () => 'À découvrir',                             priority: 19 },
    };

    const maxScore = sorted[0]?.[1]?.score || 1;
    const suggestions = ids.map(id => {
      const u     = users.find(u => u._id.toString() === id);
      if (!u) return null;
      const entry = scoreMap[id];
      const sortedReasons = [...entry.reasons].sort((a, b) => (REASON_CONFIG[a]?.priority || 99) - (REASON_CONFIG[b]?.priority || 99));
      const badges = sortedReasons.slice(0, 4).map(reason => {
        const cfg    = REASON_CONFIG[reason];
        const detail = entry.details[reason];
        return { reason, emoji: cfg?.emoji || '•', label: cfg?.label ? cfg.label(detail) : reason };
      });
      const mainBadge   = badges[0] || { emoji: '👤', label: 'Suggestion' };
      const normalScore = Math.round((entry.score / maxScore) * 100);
      return { ...u.toObject(), score: entry.score, normalScore, mainBadge, badges, mutualCount: entry.reasons.has('mutual') ? (entry.details.mutual || 0) : 0 };
    }).filter(Boolean);

    res.json({ suggestions, page, total, hasMore: total > page * limit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ignoreSuggestion = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { ignoredSuggestions: req.params.userId } });
    res.json({ message: 'Suggestion ignorée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile, updateProfile, updateAvatar, updateCover,
  updatePassword, getUserArticles, deleteAccount,
  getFriendSuggestions, ignoreSuggestion,
};