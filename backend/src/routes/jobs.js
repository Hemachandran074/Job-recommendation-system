const express = require('express');
const router = express.Router();
const { getSuggestedJobs, getRecentJobs, getJobsBySpecialization } = require('../controllers/jobsController');

// GET /api/v1/jobs/suggested/:userId
router.get('/suggested/:userId', getSuggestedJobs);

// GET /api/v1/jobs/recent
router.get('/recent', getRecentJobs);

// GET /api/v1/jobs/specialization/:field
router.get('/specialization/:field', getJobsBySpecialization);

module.exports = router;
