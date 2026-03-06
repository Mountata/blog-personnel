const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { protect } = require('../middleware/authMiddleware');

const {
  getProfile, updateProfile,
  toggleProfileLike,
  addProfileComment, deleteProfileComment,
  recommendProfile,
} = require('../controllers/profileController');

// ── Upload avatar + cover en champs séparés ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'avatar' ? 'avatars' : 'covers';
    cb(null, `uploads/${folder}/`);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'avatar',     maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]);

router.use(protect);

router.get('/:userId',                         getProfile);
router.put('/',                                upload, updateProfile);
router.post('/:userId/like',                   toggleProfileLike);
router.post('/:userId/comments',               addProfileComment);
router.delete('/:userId/comments/:commentId',  deleteProfileComment);
router.post('/:userId/recommend',              recommendProfile);

module.exports = router;