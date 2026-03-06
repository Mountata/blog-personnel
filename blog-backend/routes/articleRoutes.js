const express = require('express');
const router = express.Router();
const {
  createArticle, getFeed, getMyArticles,
  getArticle, updateArticle, deleteArticle, saveArticle
} = require('../controllers/articleController');
const { protect } = require('../middleware/authMiddleware');
const { uploadArticle } = require('../middleware/uploadMiddleware');

router.get('/feed',        protect, getFeed);
router.get('/my',          protect, getMyArticles);
router.post('/',           protect, uploadArticle.array('images', 10), createArticle);
router.get('/:id',         protect, getArticle);
router.put('/:id',         protect, uploadArticle.array('images', 10), updateArticle);
router.delete('/:id',      protect, deleteArticle);
router.post('/:id/save',   protect, saveArticle);

module.exports = router;