const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar, uploadCover } = require('../middleware/uploadMiddleware');
const {
  getUserProfile, updateProfile, updateAvatar, updateCover,
  updatePassword, getUserArticles, deleteAccount,
  getFriendSuggestions, ignoreSuggestion,
} = require('../controllers/userController');

router.get ('/suggestions',                 protect, getFriendSuggestions);
router.post('/suggestions/ignore/:userId',  protect, ignoreSuggestion);
router.get ('/profile/:id',                 protect, getUserProfile);
router.get ('/:id/articles',                protect, getUserArticles);
router.put ('/profile',                     protect, updateProfile);
router.put ('/avatar',                      protect, uploadAvatar.single('avatar'),    updateAvatar);
router.put ('/cover',                       protect, uploadCover.single('coverPhoto'), updateCover);
router.put ('/password',                    protect, updatePassword);
router.delete('/delete',                    protect, deleteAccount);

module.exports = router;