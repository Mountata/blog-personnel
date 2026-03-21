const express = require('express');
const router  = express.Router();
const {
  generateArticle,
  improveArticle,
  summarizeArticle,
  suggestTags,
  suggestComment,
  chatWithAI,
  checkContent
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate',  protect, generateArticle);
router.post('/improve',   protect, improveArticle);
router.post('/summarize', protect, summarizeArticle);
router.post('/tags',      protect, suggestTags);
router.post('/comment',   protect, suggestComment);
router.post('/chat',      protect, chatWithAI);
router.post('/check',     protect, checkContent);

module.exports = router;