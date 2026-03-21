const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/friends/request/:userId — Envoyer demande d'ami
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString())
      return res.status(400).json({ message: 'Vous ne pouvez pas vous ajouter vous-même' });

    const recipient = await User.findById(userId);
    if (!recipient) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Vérifier si déjà amis ou demande existante
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted')
        return res.status(400).json({ message: 'Déjà amis' });
      if (existing.status === 'pending')
        return res.status(400).json({ message: 'Demande déjà envoyée' });
      if (existing.status === 'blocked')
        return res.status(400).json({ message: 'Action impossible' });
    }

    const friendship = await Friendship.create({
      requester: req.user._id,
      recipient: userId
    });

    // Notification
    await Notification.create({
      recipient: userId,
      sender:    req.user._id,
      type:      'friend_request'
    });

    res.status(201).json({ message: 'Demande d\'ami envoyée', friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/friends/accept/:friendshipId — Accepter demande
const acceptFriendRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if (!friendship)
      return res.status(404).json({ message: 'Demande non trouvée' });

    if (friendship.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    friendship.status = 'accepted';
    await friendship.save();

    // Notification
    await Notification.create({
      recipient: friendship.requester,
      sender:    req.user._id,
      type:      'friend_accepted'
    });

    res.json({ message: 'Demande acceptée', friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/friends/reject/:friendshipId — Refuser demande
const rejectFriendRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if (!friendship)
      return res.status(404).json({ message: 'Demande non trouvée' });

    if (friendship.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    await friendship.deleteOne();
    res.json({ message: 'Demande refusée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/friends/:userId — Supprimer un ami
const removeFriend = async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: req.params.userId, status: 'accepted' },
        { requester: req.params.userId, recipient: req.user._id, status: 'accepted' }
      ]
    });

    res.json({ message: 'Ami supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/friends/block/:userId — Bloquer un utilisateur
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.blockedUsers.includes(req.params.userId)) {
      user.blockedUsers.push(req.params.userId);
      await user.save();
    }

    // Supprimer l'amitié si existante
    await Friendship.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.user._id }
      ]
    });

    res.json({ message: 'Utilisateur bloqué' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/friends/unblock/:userId — Débloquer
const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.userId }
    });

    res.json({ message: 'Utilisateur débloqué' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/friends — Mes amis
const getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: req.user._id, status: 'accepted' },
        { recipient: req.user._id, status: 'accepted' }
      ]
    })
    .populate('requester', 'fullName username avatar isOnline')
    .populate('recipient', 'fullName username avatar isOnline');

    const friends = friendships.map(f =>
      f.requester._id.toString() === req.user._id.toString()
        ? f.recipient
        : f.requester
    );

    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/friends/requests — Demandes reçues
const getFriendRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user._id,
      status:    'pending'
    }).populate('requester', 'fullName username avatar');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/friends/sent — Demandes envoyées
const getSentRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      requester: req.user._id,
      status:    'pending'
    }).populate('recipient', 'fullName username avatar');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/friends/cancel/:userId — Annuler demande envoyée
const cancelRequest = async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      requester: req.user._id,
      recipient: req.params.userId,
      status:    'pending'
    });

    res.json({ message: 'Demande annulée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getFriendRequests,
  getSentRequests,
  cancelRequest
};