const Circle = require('../models/Circle');
const CircleMember = require('../models/CircleMember');
const CirclePost = require('../models/CirclePost');
const CirclePoll = require('../models/CirclePoll');
const CircleEvent = require('../models/CircleEvent');
const Notification = require('../models/Notification');

// Helper : vérifier que l'utilisateur est membre actif
const getActiveMembership = async (circleId, userId) => {
  return await CircleMember.findOne({
    circle: circleId,
    user:   userId,
    status: 'active',
  });
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/:id/posts — Fil du cercle
// ─────────────────────────────────────────────────────────────
const getPosts = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;

    const posts = await CirclePost.find({ circle: req.params.id })
      .populate('author',   'fullName username avatar isOnline')
      .populate('pollRef')
      .populate('eventRef')
      .populate('reactions.user', 'fullName username')
      .populate('comments.author', 'fullName username avatar')
      .sort({ isPinned: -1, createdAt: -1 }) // épinglé en premier
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await CirclePost.countDocuments({ circle: req.params.id });

    res.json({ posts, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/posts — Créer un post texte/image
// ─────────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { content } = req.body;
    const images = req.files ? req.files.map(f => `/uploads/circles/${f.filename}`) : [];

    const post = await CirclePost.create({
      circle:  req.params.id,
      author:  req.user._id,
      content,
      images,
      type:    'post',
    });

    await Circle.findByIdAndUpdate(req.params.id, { $inc: { postCount: 1 } });

    const populated = await CirclePost.findById(post._id)
      .populate('author', 'fullName username avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/circles/:id/posts/:postId — Supprimer un post
// Auteur, modérateur ou créateur peuvent supprimer
// ─────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const post = await CirclePost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post non trouvé' });

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin  = ['creator', 'moderator'].includes(membership.role);

    if (!isAuthor && !isAdmin)
      return res.status(403).json({ message: 'Non autorisé' });

    // Si c'était le post épinglé, désépingler
    const circle = await Circle.findById(req.params.id);
    if (circle.pinnedPost?.toString() === post._id.toString()) {
      circle.pinnedPost = null;
      await circle.save();
    }

    await post.deleteOne();
    await Circle.findByIdAndUpdate(req.params.id, { $inc: { postCount: -1 } });

    res.json({ message: 'Post supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/posts/:postId/react — Réagir à un post
// ─────────────────────────────────────────────────────────────
const reactToPost = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { emoji } = req.body;
    const post = await CirclePost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post non trouvé' });

    // Supprimer l'ancienne réaction de cet utilisateur s'il en a une
    const existingIdx = post.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingIdx !== -1) {
      if (post.reactions[existingIdx].emoji === emoji) {
        // Même emoji = toggle off
        post.reactions.splice(existingIdx, 1);
      } else {
        // Emoji différent = changer la réaction
        post.reactions[existingIdx].emoji = emoji;
      }
    } else {
      post.reactions.push({ user: req.user._id, emoji });
    }

    await post.save();
    res.json({ reactions: post.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/posts/:postId/comment — Commenter
// ─────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { content } = req.body;
    const post = await CirclePost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post non trouvé' });

    post.comments.push({ author: req.user._id, content });
    await post.save();

    // Notifier l'auteur du post (sauf si c'est lui qui commente)
    if (post.author.toString() !== req.user._id.toString()) {
      const circle = await Circle.findById(req.params.id);
      await Notification.create({
        recipient: post.author,
        sender:    req.user._id,
        type:      'circle_comment',
        message:   `a commenté votre post dans le cercle "${circle.name}"`,
        link:      `/circles/${req.params.id}`,
      });
    }

    const updated = await CirclePost.findById(post._id)
      .populate('comments.author', 'fullName username avatar');

    res.json({ comments: updated.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/polls — Créer un sondage
// ─────────────────────────────────────────────────────────────
const createPoll = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { question, options, multipleChoice, expiresAt, content } = req.body;

    if (!options || options.length < 2)
      return res.status(400).json({ message: 'Un sondage nécessite au moins 2 options' });

    // Créer le sondage
    const poll = await CirclePoll.create({
      circle:         req.params.id,
      author:         req.user._id,
      question,
      options:        options.map(text => ({ text, voters: [] })),
      multipleChoice: multipleChoice || false,
      expiresAt:      expiresAt || null,
    });

    // Créer le post lié au sondage
    const post = await CirclePost.create({
      circle:  req.params.id,
      author:  req.user._id,
      content: content || question,
      type:    'poll',
      pollRef: poll._id,
    });

    await Circle.findByIdAndUpdate(req.params.id, { $inc: { postCount: 1 } });

    const populated = await CirclePost.findById(post._id)
      .populate('author',  'fullName username avatar')
      .populate('pollRef');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/polls/:pollId/vote — Voter dans un sondage
// ─────────────────────────────────────────────────────────────
const votePoll = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { optionIndexes } = req.body; // tableau d'index ex: [0] ou [0,2]
    const poll = await CirclePoll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Sondage non trouvé' });

    if (!poll.isActive || (poll.expiresAt && poll.expiresAt < new Date()))
      return res.status(400).json({ message: 'Ce sondage est terminé' });

    // Retirer les votes précédents de cet utilisateur
    poll.options.forEach(opt => {
      opt.voters = opt.voters.filter(v => v.toString() !== req.user._id.toString());
    });

    // Ajouter les nouveaux votes
    const indexes = poll.multipleChoice ? optionIndexes : [optionIndexes[0]];
    indexes.forEach(idx => {
      if (poll.options[idx]) {
        poll.options[idx].voters.push(req.user._id);
      }
    });

    await poll.save();
    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/events — Créer un événement
// ─────────────────────────────────────────────────────────────
const createEvent = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { title, description, startDate, endDate, location, content } = req.body;
    const coverImage = req.file ? `/uploads/circles/${req.file.filename}` : '';

    const event = await CircleEvent.create({
      circle:      req.params.id,
      author:      req.user._id,
      title,
      description: description || '',
      startDate,
      endDate:     endDate || null,
      location:    location || '',
      coverImage,
      attendees:   [{ user: req.user._id, status: 'going' }], // créateur participe par défaut
    });

    // Créer le post lié à l'événement
    const post = await CirclePost.create({
      circle:   req.params.id,
      author:   req.user._id,
      content:  content || `Nouvel événement : ${title}`,
      type:     'event',
      eventRef: event._id,
    });

    await Circle.findByIdAndUpdate(req.params.id, { $inc: { postCount: 1 } });

    const populated = await CirclePost.findById(post._id)
      .populate('author',   'fullName username avatar')
      .populate('eventRef');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/events/:eventId/attend — Répondre à un event
// ─────────────────────────────────────────────────────────────
const attendEvent = async (req, res) => {
  try {
    const membership = await getActiveMembership(req.params.id, req.user._id);
    if (!membership) return res.status(403).json({ message: 'Accès refusé' });

    const { status } = req.body; // 'going' | 'maybe' | 'notGoing'
    const event = await CircleEvent.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

    const existing = event.attendees.findIndex(
      a => a.user.toString() === req.user._id.toString()
    );

    if (existing !== -1) {
      event.attendees[existing].status = status;
    } else {
      event.attendees.push({ user: req.user._id, status });
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPosts,
  createPost,
  deletePost,
  reactToPost,
  addComment,
  createPoll,
  votePoll,
  createEvent,
  attendEvent,
};