const { supabase } = require('../config/supabaseClient');
const { fetchJobs } = require('../utils/rapidApiClient');
const { buildQueryFromSkills, matchBySkills } = require('../utils/recommendation');

/**
 * GET /api/v1/jobs/suggested/:userId
 * Fetches user skills from Supabase then queries RapidAPI and returns jobs that match skills.
 */
async function getSuggestedJobs(req, res, next) {
  try {
    const { userId } = req.params;
    // fetch profile
    const { data: profile, error: pErr } = await supabase.from('profiles').select('skills').eq('id', userId).maybeSingle();
    if (pErr) return res.status(400).json({ status: 'error', message: pErr.message });
    const skills = (profile && profile.skills) || [];

    if (!skills.length) {
      return res.json({ status: 'ok', message: 'no skills found for user', data: [] });
    }

    const query = buildQueryFromSkills(skills, 6);

    let jobs = [];
    try {
      const apiData = await fetchJobs({ query });
      // Attempt to parse job list from common fields - adapt if your RapidAPI provider differs
      jobs = Array.isArray(apiData?.data) ? apiData.data : Array.isArray(apiData?.results) ? apiData.results : apiData?.jobs || [];
    } catch (e) {
      // If RapidAPI not configured or call failed, return empty list gracefully
      console.warn('fetchJobs failed:', e.message || e);
      return res.json({ status: 'ok', message: 'RapidAPI not configured or failed - returning no suggestions', data: [] });
    }

    // simple filtering by skills (best-effort)
    const filtered = jobs.filter(job => matchBySkills(job, skills)).slice(0, 40);

    return res.json({ status: 'ok', data: filtered });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/jobs/recent
 * Fetch recent jobs (default: last 7 days) from RapidAPI. If API returns posting date, filter; else return results.
 */
async function getRecentJobs(req, res, next) {
  try {
    // fallback query to get recent listings - you can customize this
    const query = req.query.q || 'recent jobs';
    let jobs = [];
    try {
      const apiData = await fetchJobs({ query });
      jobs = Array.isArray(apiData?.data) ? apiData.data : Array.isArray(apiData?.results) ? apiData.results : apiData?.jobs || [];
    } catch (e) {
      console.warn('fetchJobs failed:', e.message || e);
      return res.json({ status: 'ok', message: 'RapidAPI not configured or failed - returning no recent jobs', data: [] });
    }

    // try to filter by date field if available
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = jobs.filter(job => {
      const dateStr = job?.published_at || job?.created_at || job?.date || job?.posted_at;
      if (!dateStr) return true; // keep if no date provided
      const ts = Date.parse(dateStr);
      return !isNaN(ts) ? ts >= sevenDaysAgo : true;
    }).slice(0, 50);

    return res.json({ status: 'ok', data: recent });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/jobs/specialization/:field
 * Fetch jobs from RapidAPI using specialization keyword
 */
async function getJobsBySpecialization(req, res, next) {
  try {
    const { field } = req.params;
    let jobs = [];
    try {
      const apiData = await fetchJobs({ query: field });
      jobs = Array.isArray(apiData?.data) ? apiData.data : Array.isArray(apiData?.results) ? apiData.results : apiData?.jobs || [];
    } catch (e) {
      console.warn('fetchJobs failed:', e.message || e);
      return res.json({ status: 'ok', message: 'RapidAPI not configured or failed - returning no specialization jobs', data: [] });
    }
    return res.json({ status: 'ok', data: jobs });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSuggestedJobs, getRecentJobs, getJobsBySpecialization };

/**
 * GET /api/v1/jobs
 * Query params: limit, skip, job_type, remote, skill
 * Returns a paginated list of jobs from the `jobs` table.
 */
async function getAllJobs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = parseInt(req.query.skip, 10) || 0;
    const job_type = req.query.job_type;
    const remote = req.query.remote;
    const skill = req.query.skill;

    // Build base query
    let query = supabase.from('jobs').select('*');

    if (job_type) query = query.eq('job_type', job_type);
    if (remote !== undefined) {
      const boolRemote = remote === 'true' || remote === '1';
      query = query.eq('remote', boolRemote);
    }
    // simple skill filter: jobs table should have `skills` as text[] or json
    if (skill) query = query.or(`skills.cs.{${skill}}`);

    const from = skip;
    const to = skip + limit - 1;

    const { data, error } = await query.range(from, to);
    if (error) return res.status(400).json({ status: 'error', message: error.message });

    return res.json(data || []);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/jobs/:id
 * Returns a single job by id from the `jobs` table.
 */
async function getJobById(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ status: 'error', message: 'job id required' });

    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(400).json({ status: 'error', message: error.message });
    if (!data) return res.status(404).json({ status: 'error', message: 'job not found' });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/jobs/store
 * Body: job object returned from RapidAPI or frontend. Stores (upserts) into `jobs` table and returns stored record.
 */
async function storeJob(req, res, next) {
  try {
    const job = req.body;
    if (!job) return res.status(400).json({ status: 'error', message: 'job data required' });

    // Ensure we have an id - if not, create a synthetic one
    const jobPayload = { ...job };
    if (!jobPayload.id && !jobPayload._id) {
      jobPayload.id = `job_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    } else {
      jobPayload.id = jobPayload.id || jobPayload._id;
    }

    // Upsert into jobs table
    const { data, error } = await supabase.from('jobs').upsert(jobPayload).select().maybeSingle();
    if (error) return res.status(400).json({ status: 'error', message: error.message });

    return res.json({ status: 'ok', job: data });
  } catch (err) {
    next(err);
  }
}

// Export new handlers
module.exports = Object.assign(module.exports, { getAllJobs, getJobById, storeJob });
