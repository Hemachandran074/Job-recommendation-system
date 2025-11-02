const express = require('express');
const router = express.Router();
const { 
  getSuggestedJobs, 
  getRecentJobs, 
  getJobsBySpecialization,
  getAllJobs, 
  getJobById, 
  storeJob,
  refreshJobCache,
  getCachedJobs
} = require('../controllers/jobsController');

// GET /api/v1/jobs/suggested/:userId - Dynamic skill-based job recommendations
router.get('/suggested/:userId', getSuggestedJobs);

// GET /api/v1/jobs/cache/:userId - Get cached job recommendations
router.get('/cache/:userId', getCachedJobs);

// POST /api/v1/jobs/refresh-cache/:userId - Refresh job cache for user
router.post('/refresh-cache/:userId', refreshJobCache);

// GET /api/v1/jobs/recent - Recent jobs
router.get('/recent', getRecentJobs);

// GET /api/v1/jobs/specialization/:field - Jobs by specialization (with optional user enhancement)
router.get('/specialization/:field', getJobsBySpecialization);

// GET /api/v1/jobs - list jobs (pagination)
router.get('/', getAllJobs);

// GET /api/v1/jobs/:id - job details
router.get('/:id', getJobById);

// POST /api/v1/jobs/store - store job when user clicks
router.post('/store', storeJob);

// POST /api/v1/jobs/extract - Extract structured fields from job description using LLM (GROQ)
const { extractFromDescription } = require('../controllers/llmController');
router.post('/extract', extractFromDescription);

module.exports = router;
