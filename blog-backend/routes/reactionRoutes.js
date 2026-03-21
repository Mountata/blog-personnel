const express = require('express');
const router  = express.Router();
const {
  reactToArticle,
  getReactions,
  getReactionsList
} = require('../controllers/reactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:articleId',       protect, reactToArticle);
router.get('/:articleId',        protect, getReactions);
router.get('/:articleId/list',   protect, getReactionsList);

module.exports = router;