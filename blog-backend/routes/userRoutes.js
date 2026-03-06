const express = require('express');
const router  = express.Router();
const {
  getUserProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  updatePassword,
  getUserArticles,
  deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar, uploadCover } = require('../middleware/uploadMiddleware');

router.get('/profile/:id',    protect, getUserProfile);
router.get('/:id/articles',   protect, getUserArticles);
router.put('/profile',        protect, updateProfile);
router.put('/avatar',         protect, uploadAvatar.single('avatar'),     updateAvatar);
router.put('/cover',          protect, uploadCover.single('coverPhoto'),  updateCover);
router.put('/password',       protect, updatePassword);
router.delete('/delete',      protect, deleteAccount);

module.exports = router;