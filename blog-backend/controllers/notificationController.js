const Notification = require('../models/Notification');

// GET /api/notifications — Toutes mes notifications
const getNotifications = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'fullName username avatar')
      .populate('article', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read:      false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/:id/read — Marquer une notif comme lue
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification)
      return res.status(404).json({ message: 'Notification non trouvée' });

    if (notification.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/read-all — Tout marquer comme lu
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id — Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification)
      return res.status(404).json({ message: 'Notification non trouvée' });

    if (notification.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    await notification.deleteOne();
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications — Supprimer toutes mes notifications
const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: 'Toutes les notifications supprimées' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};