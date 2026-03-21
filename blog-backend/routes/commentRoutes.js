const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const {
  addComment, getComments, updateComment,
  deleteComment, likeComment, addReply, deleteReply,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/comments/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const valid   = allowed.test(path.extname(file.originalname).toLowerCase())
                 && allowed.test(file.mimetype);
    valid ? cb(null, true) : cb(new Error('Image uniquement'));
  },
});

router.post  ('/:articleId',             protect, upload.array('images', 4), addComment);
router.get   ('/:articleId',             protect, getComments);
router.put   ('/:id',                    protect, updateComment);
router.delete('/:id',                    protect, deleteComment);
router.post  ('/:id/like',               protect, likeComment);
router.post  ('/:id/reply',              protect, addReply);
router.delete('/:id/reply/:replyId',     protect, deleteReply);

module.exports = router;