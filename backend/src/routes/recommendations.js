const express = require('express');
const router = express.Router();
const { getPersonalizedRecommendations } = require('../controllers/recommendationsController');

/**
 * POST /api/v1/recommendations
 * Body: { user_id, limit }
 * Get personalized job recommendations for a user based on their skills
 */
router.post('/', getPersonalizedRecommendations);

module.exports = router;
