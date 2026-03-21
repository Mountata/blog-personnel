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

// ✅ :userId partout pour correspondre au controller
router.get   ('/:userId',                        getProfile);
router.put   ('/',                               upload, updateProfile);  // ✅ pas de :userId pour update (c'est req.user._id)
router.post  ('/:userId/like',                   toggleProfileLike);
router.post  ('/:userId/comments',               addProfileComment);      // ✅ comments (pluriel)
router.delete('/:userId/comments/:commentId',    deleteProfileComment);   // ✅ comments (pluriel)
router.post  ('/:userId/recommend',              recommendProfile);

module.exports = router;