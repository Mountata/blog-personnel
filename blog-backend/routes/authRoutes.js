const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/authController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename:    (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/register',        upload.single('avatar'), register);
router.post('/login',           login);
router.post('/logout',          protect, logout);
router.get ('/me',              protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp',      verifyOtp);
router.post('/reset-password',  resetPassword);

module.exports = router;