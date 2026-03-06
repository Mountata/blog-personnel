const Circle = require('../models/Circle');
const CircleMember = require('../models/CircleMember');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────────────────────────
// GET /api/circles/:id/members — Liste des membres
// ─────────────────────────────────────────────────────────────
const getMembers = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est membre du cercle
    const myMembership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
      status: { $in: ['active', 'blocked'] },
    });
    if (!myMembership) return res.status(403).json({ message: 'Accès refusé' });

    const members = await CircleMember.find({ circle: req.params.id })
      .populate('user',      'fullName username avatar isOnline lastSeen')
      .populate('invitedBy', 'fullName username')
      .populate('blockedBy', 'fullName username')
      .sort({ role: 1, joinedAt: 1 }); // créateur en premier, puis modérateurs, puis membres

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/invite — Inviter un utilisateur
// Créateur et modérateurs uniquement
// ─────────────────────────────────────────────────────────────
const inviteMember = async (req, res) => {
  try {
    const { userId } = req.body;

    // Vérifier les droits (créateur ou modérateur)
    const myMembership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
      status: 'active',
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role))
      return res.status(403).json({ message: 'Non autorisé' });

    // Vérifier si déjà membre
    const existing = await CircleMember.findOne({ circle: req.params.id, user: userId });
    if (existing) return res.status(400).json({ message: 'Cet utilisateur est déjà dans le cercle' });

    const circle = await Circle.findById(req.params.id);

    // Créer le membre en statut 'pending' (invitation)
    await CircleMember.create({
      circle:    req.params.id,
      user:      userId,
      role:      'member',
      status:    'pending',
      invitedBy: req.user._id,
    });

    // Créer une notification pour l'utilisateur invité
    await Notification.create({
      recipient: userId,
      sender:    req.user._id,
      type:      'circle_invite',
      message:   `vous a invité à rejoindre le cercle "${circle.name}"`,
      link:      `/circles/${circle._id}`,
    });

    res.json({ message: 'Invitation envoyée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/invite/accept — Accepter une invitation
// ─────────────────────────────────────────────────────────────
const acceptInvite = async (req, res) => {
  try {
    const membership = await CircleMember.findOne({
      circle: req.params.id,
      user:   req.user._id,
      status: 'pending',
    });
    if (!membership) return res.status(404).json({ message: 'Invitation non trouvée' });

    membership.status   = 'active';
    membership.joinedAt = new Date();
    await membership.save();

    await Circle.findByIdAndUpdate(req.params.id, { $inc: { memberCount: 1 } });

    res.json({ message: 'Invitation acceptée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/circles/:id/invite/decline — Refuser une invitation
// ─────────────────────────────────────────────────────────────
const declineInvite = async (req, res) => {
  try {
    await CircleMember.findOneAndDelete({
      circle: req.params.id,
      user:   req.user._id,
      status: 'pending',
    });
    res.json({ message: 'Invitation refusée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/members/:userId/role — Changer le rôle
// Créateur uniquement
// ─────────────────────────────────────────────────────────────
const changeRole = async (req, res) => {
  try {
    const { role } = req.body; // 'moderator' ou 'member'

    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Cercle non trouvé' });

    // Seul le créateur peut changer les rôles
    if (circle.creator.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Seul le créateur peut changer les rôles' });

    // On ne peut pas changer le rôle du créateur
    if (req.params.userId === req.user._id.toString())
      return res.status(400).json({ message: 'Impossible de changer votre propre rôle' });

    if (!['moderator', 'member'].includes(role))
      return res.status(400).json({ message: 'Rôle invalide' });

    await CircleMember.findOneAndUpdate(
      { circle: req.params.id, user: req.params.userId },
      { role }
    );

    res.json({ message: `Rôle mis à jour : ${role}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/members/:userId/block — Bloquer un membre
// Créateur ou modérateur
// ─────────────────────────────────────────────────────────────
const blockMember = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id, user: req.user._id, status: 'active'
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role))
      return res.status(403).json({ message: 'Non autorisé' });

    // Un modérateur ne peut pas bloquer le créateur
    const targetMembership = await CircleMember.findOne({
      circle: req.params.id, user: req.params.userId
    });
    if (!targetMembership) return res.status(404).json({ message: 'Membre non trouvé' });

    if (targetMembership.role === 'creator')
      return res.status(403).json({ message: 'Impossible de bloquer le créateur' });

    if (myMembership.role === 'moderator' && targetMembership.role === 'moderator')
      return res.status(403).json({ message: 'Un modérateur ne peut pas bloquer un autre modérateur' });

    targetMembership.status    = 'blocked';
    targetMembership.blockedBy = req.user._id;
    targetMembership.blockedAt = new Date();
    await targetMembership.save();

    res.json({ message: 'Membre bloqué' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/members/:userId/unblock — Débloquer
// Créateur ou modérateur
// ─────────────────────────────────────────────────────────────
const unblockMember = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id, user: req.user._id, status: 'active'
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role))
      return res.status(403).json({ message: 'Non autorisé' });

    await CircleMember.findOneAndUpdate(
      { circle: req.params.id, user: req.params.userId },
      { status: 'active', blockedBy: null, blockedAt: null }
    );

    res.json({ message: 'Membre débloqué' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/circles/:id/members/:userId/remove — Retirer un membre
// Créateur ou modérateur
// ─────────────────────────────────────────────────────────────
const removeMember = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id, user: req.user._id, status: 'active'
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role))
      return res.status(403).json({ message: 'Non autorisé' });

    const target = await CircleMember.findOne({ circle: req.params.id, user: req.params.userId });
    if (!target) return res.status(404).json({ message: 'Membre non trouvé' });
    if (target.role === 'creator') return res.status(403).json({ message: 'Impossible de retirer le créateur' });

    await target.deleteOne();
    await Circle.findByIdAndUpdate(req.params.id, { $inc: { memberCount: -1 } });

    res.json({ message: 'Membre retiré du cercle' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/circles/:id/withdraw — Demander à quitter le cercle
// ─────────────────────────────────────────────────────────────
const requestWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;

    const membership = await CircleMember.findOne({
      circle: req.params.id, user: req.user._id, status: 'active'
    });
    if (!membership) return res.status(404).json({ message: 'Vous n\'êtes pas membre de ce cercle' });

    // Le créateur ne peut pas quitter son propre cercle
    if (membership.role === 'creator')
      return res.status(400).json({ message: 'Le créateur ne peut pas quitter son cercle. Transférez d\'abord la propriété.' });

    // Vérifier qu'il n'y a pas déjà une demande en cours
    const existing = await WithdrawalRequest.findOne({
      circle: req.params.id, requester: req.user._id, status: 'pending'
    });
    if (existing) return res.status(400).json({ message: 'Une demande de retrait est déjà en cours' });

    const request = await WithdrawalRequest.create({
      circle:    req.params.id,
      requester: req.user._id,
      reason:    reason || '',
    });

    // Notifier le créateur et les modérateurs
    const admins = await CircleMember.find({
      circle: req.params.id,
      role:   { $in: ['creator', 'moderator'] },
      status: 'active',
    }).select('user');

    const circle = await Circle.findById(req.params.id);

    const notifications = admins
      .filter(a => a.user.toString() !== req.user._id.toString())
      .map(a => ({
        recipient: a.user,
        sender:    req.user._id,
        type:      'withdrawal_request',
        message:   `souhaite quitter le cercle "${circle.name}"`,
        link:      `/circles/${circle._id}/members`,
      }));

    if (notifications.length > 0) await Notification.insertMany(notifications);

    res.json({ message: 'Demande de retrait envoyée', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/circles/:id/withdraw/:requestId/approve
// Valider un retrait (créateur, modérateur, ou vote membre)
// ─────────────────────────────────────────────────────────────
const approveWithdrawal = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.requestId);
    if (!request || request.status !== 'pending')
      return res.status(404).json({ message: 'Demande non trouvée ou déjà traitée' });

    const myMembership = await CircleMember.findOne({
      circle: req.params.id, user: req.user._id, status: 'active'
    });
    if (!myMembership) return res.status(403).json({ message: 'Non autorisé' });

    // Éviter de voter deux fois
    if (request.approvedBy.includes(req.user._id))
      return res.status(400).json({ message: 'Vous avez déjà validé cette demande' });

    request.approvedBy.push(req.user._id);

    // Règle de validation :
    // - 1 créateur ou 1 modérateur = retrait immédiat
    // - 3 membres simples = retrait accepté
    const isAdmin = ['creator', 'moderator'].includes(myMembership.role);
    const memberVotes = request.approvedBy.length;

    const shouldApprove = isAdmin || memberVotes >= 3;

    if (shouldApprove) {
      request.status     = 'approved';
      request.resolvedBy = req.user._id;
      request.resolvedAt = new Date();
      await request.save();

      // Retirer le membre du cercle
      await CircleMember.findOneAndDelete({ circle: req.params.id, user: request.requester });
      await Circle.findByIdAndUpdate(req.params.id, { $inc: { memberCount: -1 } });

      // Notifier le membre que sa demande est acceptée
      await Notification.create({
        recipient: request.requester,
        sender:    req.user._id,
        type:      'withdrawal_approved',
        message:   'Votre demande de retrait a été approuvée',
        link:      `/circles`,
      });

      return res.json({ message: 'Retrait approuvé, membre retiré du cercle' });
    }

    await request.save();
    res.json({ message: `Vote enregistré (${memberVotes}/3 membres requis)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/circles/:id/withdraw/pending — Demandes en attente
// ─────────────────────────────────────────────────────────────
const getPendingWithdrawals = async (req, res) => {
  try {
    const myMembership = await CircleMember.findOne({
      circle: req.params.id, user: req.user._id, status: 'active'
    });
    if (!myMembership || !['creator', 'moderator'].includes(myMembership.role))
      return res.status(403).json({ message: 'Non autorisé' });

    const requests = await WithdrawalRequest.find({
      circle: req.params.id, status: 'pending'
    }).populate('requester', 'fullName username avatar')
      .populate('approvedBy', 'fullName username');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMembers,
  inviteMember,
  acceptInvite,
  declineInvite,
  changeRole,
  blockMember,
  unblockMember,
  removeMember,
  requestWithdrawal,
  approveWithdrawal,
  getPendingWithdrawals,
};