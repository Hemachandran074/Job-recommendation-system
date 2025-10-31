const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

// POST /api/v1/auth/signup
router.post('/signup', signup);

// POST /api/v1/auth/login
router.post('/login', login);

module.exports = router;
