const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');

// GET /api/v1/users/:id
router.get('/:id', getUserProfile);

// PATCH /api/v1/users/:id
router.patch('/:id', updateUserProfile);

module.exports = router;
