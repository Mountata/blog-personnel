const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/messages/:userId — Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { userId } = req.params;

    if (!text && !req.file)
      return res.status(400).json({ message: 'Message vide' });

    const receiver = await User.findById(userId);
    if (!receiver)
      return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const image = req.file ? `/uploads/articles/${req.file.filename}` : '';

    const message = await Message.create({
      sender:   req.user._id,
      receiver: userId,
      text:     text || '',
      image
    });

    const populated = await message.populate('sender', 'fullName username avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/:userId — Conversation avec un utilisateur
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId,       receiver: req.user._id }
      ]
    })
    .populate('sender',   'fullName username avatar')
    .populate('receiver', 'fullName username avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    // Marquer comme lus
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/conversations — Liste de toutes mes conversations
const getConversations = async (req, res) => {
  try {
    // Trouver tous les utilisateurs avec qui j'ai échangé
    const messages = await Message.find({
      $or: [
        { sender:   req.user._id },
        { receiver: req.user._id }
      ]
    })
    .populate('sender',   'fullName username avatar isOnline')
    .populate('receiver', 'fullName username avatar isOnline')
    .sort({ createdAt: -1 });

    // Garder uniquement le dernier message par conversation
    const conversationsMap = new Map();

    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === req.user._id.toString()
        ? msg.receiver
        : msg.sender;

      const key = otherUser._id.toString();

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user:        otherUser,
          lastMessage: msg,
          unread:      0
        });
      }

      // Compter messages non lus
      if (
        msg.receiver._id.toString() === req.user._id.toString() &&
        !msg.read
      ) {
        const conv = conversationsMap.get(key);
        conv.unread++;
        conversationsMap.set(key, conv);
      }
    });

    const conversations = Array.from(conversationsMap.values());
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/messages/:id — Supprimer un message
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message)
      return res.status(404).json({ message: 'Message non trouvé' });

    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    await message.deleteOne();
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/unread — Nombre de messages non lus
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read:     false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  deleteMessage,
  getUnreadCount
};