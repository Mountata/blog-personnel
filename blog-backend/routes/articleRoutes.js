const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
  createArticle,
  getFeed,
  getMyArticles,
  getUserArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  saveArticle,
  trackView,     // ✅ ajout
} = require('../controllers/articleController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.mimetype.startsWith('video/')
      ? 'uploads/videos/'
      : 'uploads/articles/';
    cb(null, dest);
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video',  maxCount: 1  },
]);

router.get   ('/feed',         protect, getFeed);
router.get   ('/my',           protect, getMyArticles);
router.get   ('/user/:userId', protect, getUserArticles);
router.post  ('/',             protect, uploadFields, createArticle);
router.get   ('/:id',          protect, getArticle);
router.put   ('/:id',          protect, uploadFields, updateArticle);
router.delete('/:id',          protect, deleteArticle);
router.post  ('/:id/save',     protect, saveArticle);
router.post  ('/:id/view',     protect, trackView);   // ✅ ajout

module.exports = router;