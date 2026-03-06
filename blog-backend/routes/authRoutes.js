const express = require('express');
const router  = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

router.post('/register', uploadAvatar.single('avatar'), register);
router.post('/login',    login);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);

module.exports = router;