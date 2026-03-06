const express = require('express');
const router  = express.Router();
const { search, searchUsers, searchArticles } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',         protect, search);
router.get('/users',    protect, searchUsers);
router.get('/articles', protect, searchArticles);

module.exports = router;