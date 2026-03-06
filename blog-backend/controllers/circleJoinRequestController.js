const Circle        = require('../models/Circle');
const CircleMember  = require('../models/CircleMember');
const Notification  = require('../models/Notification');

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/join-request
// Un utilisateur demande à rejoindre un cercle privé
// ─────────────────────────────────────────────────────────────
const sendJoinRequest = async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    // Seulement pour les cercles privés et publics (pas secret)
    if (circle.type === 'secret') {
      return res.status(403).json({ message: "Ce cercle est secret, utilisez un lien d'invitation." });
    }

    // Vérifier si déjà membre ou demande en cours
    const existing = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
    });
    if (existing) {
      if (existing.status === 'active')  return res.status(400).json({ message: 'Vous êtes déjà membre.' });
      if (existing.status === 'pending') return res.status(400).json({ message: 'Demande déjà envoyée.' });
      if (existing.status === 'blocked') return res.status(403).json({ message: 'Vous ne pouvez pas rejoindre ce cercle.' });
    }

    // ── Cercle PUBLIC → rejoindre directement ─────────────────
    if (circle.type === 'public') {
      await CircleMember.create({
        circle:   req.params.id,
        user:     req.user._id,
        role:     'member',
        status:   'active',
        joinedAt: new Date(),
      });
      await Circle.findByIdAndUpdate(req.params.id, { $inc: { memberCount: 1 } });

      // Notifier le créateur
      const creator = await CircleMember.findOne({ circle: req.params.id, role: 'creator' }).select('user');
      if (creator && creator.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: creator.user,
          sender:    req.user._id,
          type:      'join_accepted',
          message:   `a rejoint votre cercle "${circle.name}"`,
          link:      `/circles/${circle._id}`,
        });
      }
      return res.json({ message: 'Vous avez rejoint le cercle !', joined: true });
    }

    // ── Cercle PRIVÉ → demande en attente ─────────────────────

    // Créer la demande (status: pending)
    await CircleMember.create({
      circle:    req.params.id,
      user:      req.user._id,
      role:      'member',
      status:    'pending',
      invitedBy: null,
    });

    // Notifier le créateur et les modérateurs
    const admins = await CircleMember.find({
      circle: req.params.id,
      role:   { $in: ['creator', 'moderator'] },
      status: 'active',
    }).select('user');

    const notifications = admins.map(a => ({
      recipient: a.user,
      sender:    req.user._id,
      type:      'join_request',
      message:   `souhaite rejoindre votre cercle "${circle.name}"`,
      link:      `/circles/${circle._id}/settings`,
    }));

    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.json({ message: 'Demande envoyée. Un administrateur doit valider.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/:id/join-requests
// Voir toutes les demandes en attente (admin seulement)
// ─────────────────────────────────────────────────────────────
const getJoinRequests = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
      status: 'active',
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const requests = await CircleMember.find({
      circle: req.params.id,
      status: 'pending',
    }).populate('user', 'fullName username avatar bio isOnline');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/join-requests/:userId/accept
// Accepter une demande (admin seulement)
// ─────────────────────────────────────────────────────────────
const acceptJoinRequest = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
      status: 'active',
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const membership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.params.userId,
      status: 'pending',
    });
    if (!membership) return res.status(404).json({ message: 'Demande non trouvée' });

    membership.status   = 'active';
    membership.joinedAt = new Date();
    await membership.save();

    await Circle.findByIdAndUpdate(req.params.id, { $inc: { memberCount: 1 } });

    // Notifier l'utilisateur accepté
    const circle = await Circle.findById(req.params.id);
    await Notification.create({
      recipient: req.params.userId,
      sender:    req.user._id,
      type:      'join_accepted',
      message:   `a accepté votre demande de rejoindre "${circle.name}"`,
      link:      `/circles/${circle._id}`,
    });

    res.json({ message: 'Demande acceptée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/circles/:id/join-requests/:userId/reject
// Refuser une demande (admin seulement)
// ─────────────────────────────────────────────────────────────
const rejectJoinRequest = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
      status: 'active',
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await CircleMember.findOneAndDelete({
      circle: req.params.id,
      user:   req.params.userId,
      status: 'pending',
    });

    // Notifier l'utilisateur refusé
    const circle = await Circle.findById(req.params.id);
    await Notification.create({
      recipient: req.params.userId,
      sender:    req.user._id,
      type:      'join_rejected',
      message:   `a refusé votre demande de rejoindre "${circle.name}"`,
      link:      `/circles`,
    });

    res.json({ message: 'Demande refusée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendJoinRequest,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
};