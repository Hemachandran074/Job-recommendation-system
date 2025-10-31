const express = require('express');
const router = express.Router();
const { getSuggestedJobs, getRecentJobs, getJobsBySpecialization } = require('../controllers/jobsController');
const { getAllJobs, getJobById, storeJob } = require('../controllers/jobsController');

// GET /api/v1/jobs/suggested/:userId
router.get('/suggested/:userId', getSuggestedJobs);

// GET /api/v1/jobs/recent
router.get('/recent', getRecentJobs);

// GET /api/v1/jobs/specialization/:field
router.get('/specialization/:field', getJobsBySpecialization);

// GET /api/v1/jobs - list jobs (pagination)
router.get('/', getAllJobs);

// GET /api/v1/jobs/:id - job details
router.get('/:id', getJobById);

// POST /api/v1/jobs/store - store job when user clicks
router.post('/store', storeJob);

module.exports = router;
