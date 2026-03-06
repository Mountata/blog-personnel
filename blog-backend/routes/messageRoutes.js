const express = require('express');
const router  = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  deleteMessage,
  getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { uploadMessage } = require('../middleware/uploadMiddleware');

router.get('/conversations',        protect, getConversations);
router.get('/unread',               protect, getUnreadCount);
router.get('/:userId',              protect, getConversation);
router.post('/:userId',             protect, uploadMessage.single('image'), sendMessage);
router.delete('/:id',               protect, deleteMessage);

module.exports = router;