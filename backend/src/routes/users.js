const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/userController');

// GET /api/v1/users/:id
router.get('/:id', getUserProfile);

module.exports = router;
