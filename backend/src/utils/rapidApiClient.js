const axios = require('axios');
const { RAPIDAPI_HOST, RAPIDAPI_KEY } = require('../config/rapidApi');

/**
 * Fetch jobs from the internships-api /active-jb-7d endpoint with search parameters
 * 
 * @param {Object} options - Search parameters
 * @param {string} options.query - Search query (used as title_filter)
 * @param {string} options.location - Location filter (e.g., "India", "United States")
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {number} options.per_page - Results per page (default: 20)
 * @param {boolean} options.remote - Filter for remote jobs (true/false)
 * @param {string} options.date_filter - Filter jobs posted after this date (format: YYYY-MM-DD)
 * @param {string} options.description_type - Include description ('text' or 'html')
 * @returns {Promise<Array>} - Array of job objects
 */
async function fetchJobs({ 
  query, 
  location, 
  offset = 0, 
  per_page = 20,
  remote,
  date_filter,
  description_type 
} = {}) {
  if (!RAPIDAPI_HOST || !RAPIDAPI_KEY) throw new Error('RapidAPI config missing');

  // Use the /active-jb-7d endpoint with query parameters
  const url = `https://${RAPIDAPI_HOST}/active-jb-7d`;

  // Build query parameters according to API documentation
  const params = {
    offset: offset
  };

  // Add title_filter if query provided
  if (query) {
    params.title_filter = query;
  }

  // Add location_filter if provided
  if (location) {
    params.location_filter = location;
  }

  // Add remote filter if specified
  if (typeof remote === 'boolean') {
    params.remote = remote.toString();
  }

  // Add date filter if provided (format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
  if (date_filter) {
    params.date_filter = date_filter;
  }

  // Add description_type if provided ('text' or 'html')
  if (description_type) {
    params.description_type = description_type;
  }

  const headers = {
    'x-rapidapi-host': RAPIDAPI_HOST,
    'x-rapidapi-key': RAPIDAPI_KEY
  };

  try {
    console.log(`  🌐 API Request: ${url}`);
    console.log(`  📋 Params:`, JSON.stringify(params, null, 2));
    
    const resp = await axios.get(url, { params, headers, timeout: 30000 });
    
    // The API returns an array of job objects
    const jobs = resp.data || [];
    
    console.log(`  ✅ API returned ${Array.isArray(jobs) ? jobs.length : 0} jobs`);
    
    // Limit results to per_page
    return Array.isArray(jobs) ? jobs.slice(0, per_page) : [];
  } catch (error) {
    console.error(`  ❌ RapidAPI error: ${error.response?.status} - ${error.message}`);
    if (error.response?.data) {
      console.error(`  📛 Error details:`, error.response.data);
    }
    throw error;
  }
}

/**
 * Fetch jobs dynamically for multiple skills (user's skill array).
 * Loops through each skill, calls RapidAPI with proper search parameters, and removes duplicates.
 * 
 * @param {Array<string>} skills - Array of user skills from database
 * @param {number} jobsPerSkill - Max jobs to fetch per skill (default: 10)
 * @param {string} location - Optional location filter (e.g., "India", "United States")
 * @returns {Promise<Array>} - Merged and deduplicated job listings
 */
async function fetchJobsByUserSkills(skills = [], jobsPerSkill = 10, location = null) {
  if (!RAPIDAPI_HOST || !RAPIDAPI_KEY) {
    console.warn('⚠️ RapidAPI credentials not configured');
    throw new Error('RapidAPI config missing');
  }

  if (!Array.isArray(skills) || skills.length === 0) {
    console.log('ℹ️ No skills provided, returning empty job list');
    return [];
  }

  // Remove duplicates from skills array
  const uniqueSkills = [...new Set(skills)];
  console.log(`🔍 Fetching jobs for ${uniqueSkills.length} unique skills:`, uniqueSkills);

  const allJobs = [];
  const seenIds = new Set();

  // Loop through each skill and fetch jobs
  for (const skill of uniqueSkills) {
    try {
      console.log(`  📡 Fetching jobs for skill: "${skill}"${location ? ` in ${location}` : ''}`);
      
      // Call API with proper parameters
      const jobs = await fetchJobs({ 
        query: skill,           // Use title_filter
        location: location,      // Use location_filter if provided
        offset: 0,
        per_page: jobsPerSkill
      });

      console.log(`  ✅ Found ${jobs.length} jobs for "${skill}"`);

      // Add jobs to result array, deduplicating by job_id or id
      for (const job of jobs) {
        const jobId = job.job_id || job.id || job._id || `${job.title}_${job.organization || job.company}`;
        
        if (!seenIds.has(jobId)) {
          seenIds.add(jobId);
          allJobs.push({
            ...job,
            matched_skill: skill, // Track which skill matched this job
            fetched_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error(`  ❌ Error fetching jobs for skill "${skill}":`, error.message);
      // Continue with other skills even if one fails
    }
  }

  console.log(`✅ Total unique jobs fetched: ${allJobs.length}`);
  return allJobs;
}

/**
 * Normalize and deduplicate job array based on job_id or similar identifier
 * 
 * @param {Array} jobs - Array of job objects
 * @returns {Array} - Deduplicated array
 */
function deduplicateJobs(jobs = []) {
  const seen = new Map();
  
  for (const job of jobs) {
    const jobId = job.job_id || job.id || job._id || `${job.title}_${job.company}`;
    
    if (!seen.has(jobId)) {
      seen.set(jobId, job);
    }
  }
  
  return Array.from(seen.values());
}

module.exports = { fetchJobs, fetchJobsByUserSkills, deduplicateJobs };
