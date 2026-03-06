const express = require('express');
const router  = express.Router();
const {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
  deleteReply
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:articleId',              protect, addComment);
router.get('/:articleId',               protect, getComments);
router.put('/:id',                      protect, updateComment);
router.delete('/:id',                   protect, deleteComment);
router.post('/:id/like',                protect, likeComment);
router.post('/:id/reply',               protect, addReply);
router.delete('/:id/reply/:replyId',    protect, deleteReply);

module.exports = router;