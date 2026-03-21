const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboard, getSuggestions } = require('../controllers/dashboardController');

router.use(protect);

// GET /api/dashboard           — Stats complètes Vue d'ensemble
router.get('/', getDashboard);

// GET /api/dashboard/suggestions — Suggestions amis + cercles
router.get('/suggestions', getSuggestions);

module.exports = router;