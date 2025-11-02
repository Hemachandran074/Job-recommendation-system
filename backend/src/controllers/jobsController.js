const { supabase } = require('../config/supabaseClient');
// Use Shine.com detailed scraper for comprehensive job data
const { fetchDetailedJobsBySkills } = require('../utils/shineDetailedScraper');
const { deduplicateJobs } = require('../utils/shineScraper');
const { buildQueryFromSkills, matchBySkills } = require('../utils/recommendation');

/**
 * GET /api/v1/jobs/suggested/:userId
 * Dynamically fetches jobs based on user's skills from the database.
 * - Pulls user skills from profiles table
 * - Loops through each skill and scrapes jobs from Shine.com
 * - Merges results and removes duplicates
 * - Returns personalized job recommendations
 */
async function getSuggestedJobs(req, res, next) {
  try {
    const { userId } = req.params;
    const jobsPerSkill = parseInt(req.query.jobsPerSkill, 10) || 15; // Jobs to fetch per skill
    
    console.log(`📊 Fetching suggested jobs for user: ${userId}`);
    
    // Fetch user profile with skills, interests, technical domains, and preferred location
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('skills, interests, technical_domains, preferred_city, location')
      .eq('id', userId)
      .maybeSingle();
    
    if (pErr) {
      console.error('❌ Error fetching user profile:', pErr.message);
      return res.status(400).json({ status: 'error', message: pErr.message });
    }

    // Combine all skills, interests, and technical domains
    const skills = (profile?.skills || []);
    const interests = (profile?.interests || []);
    const domains = (profile?.technical_domains || []);
    const allSkills = [...new Set([...skills, ...interests, ...domains])]; // Remove duplicates

    // Get user's preferred location (preferred_city takes priority over location)
    const userLocation = profile?.preferred_city || profile?.location || null;
    
    if (userLocation) {
      console.log(`📍 User's preferred location: ${userLocation}`);
    } else {
      console.log('📍 No preferred location set, searching all locations');
    }

    if (!allSkills.length) {
      console.log('ℹ️ No skills found for user, returning empty list');
      return res.json({ 
        status: 'ok', 
        message: 'No skills found for user. Please update your profile.',
        data: [] 
      });
    }

    console.log(`🎯 User skills (${allSkills.length}):`, allSkills);

    let jobs = [];
    try {
      // Dynamically scrape detailed jobs for each skill from Shine.com with user's preferred location
      jobs = await fetchDetailedJobsBySkills(allSkills, jobsPerSkill, userLocation);
      
      // Store fetched jobs in database
      const storedJobs = await storeJobsInDatabase(jobs);
      console.log(`💾 Stored ${storedJobs.length} jobs in database`);
      
      // Additional filtering: prioritize jobs that match multiple skills
      jobs = jobs.map(job => {
        const matchCount = allSkills.filter(skill => {
          const jobTitle = (job.title || '').toLowerCase();
          const jobDesc = (job.description || '').toLowerCase();
          const jobSkills = (job.skills || []).map(s => String(s).toLowerCase());
          const skillLower = skill.toLowerCase();
          
          return jobTitle.includes(skillLower) || 
                 jobDesc.includes(skillLower) || 
                 jobSkills.includes(skillLower);
        }).length;
        
        return { ...job, match_score: matchCount };
      });

      // Sort by match score (highest first)
      jobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

      console.log(`✅ Returning ${jobs.length} personalized job recommendations`);

    } catch (e) {
      console.warn('⚠️ Shine.com scraping failed:', e.message);
      return res.json({ 
        status: 'ok', 
        message: 'Web scraping failed - returning no suggestions', 
        data: [] 
      });
    }

    return res.json({ 
      status: 'ok', 
      data: jobs.slice(0, 50), // Limit to top 50 results
      total: jobs.length,
      user_skills: allSkills
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/jobs/recent
 * Fetch recent jobs (default: last 7 days) from Shine.com web scraping.
 */
async function getRecentJobs(req, res, next) {
  try {
    // fallback query to get recent listings - you can customize this
    const query = req.query.q || 'recent jobs';
    let jobs = [];
    try {
      const scraped = await fetchJobs({ query });
      jobs = Array.isArray(scraped) ? scraped : [];
    } catch (e) {
      console.warn('fetchJobs failed:', e.message || e);
      return res.json({ status: 'ok', message: 'Web scraping failed - returning no recent jobs', data: [] });
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
 * Scrape jobs from Shine.com using specialization keyword.
 * Optionally accepts userId query param to fetch user's skills and merge with specialization.
 */
/**
 * GET /api/v1/jobs/specialization/:field
 * Scrape and return jobs for a specific specialization
 * Optionally enhanced with user's preferred location and skills
 * Query params: userId (optional), location (optional)
 */
async function getJobsBySpecialization(req, res, next) {
  try {
    const { field } = req.params;
    const { userId } = req.query; // Optional: get user's location
    
    console.log(`🔍 Fetching jobs for specialization: ${field}`);
    
    // ONLY search for the specialization field (no user skills added)
    let searchTerms = [field];
    let userLocation = null;
    
    // If userId provided, get user's preferred location (but NOT skills)
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_city, location')
          .eq('id', userId)
          .maybeSingle();
        
        if (profile) {
          // Get user's preferred location for filtering
          userLocation = profile?.preferred_city || profile?.location || null;
          
          if (userLocation) {
            console.log(`📍 Using user's preferred location: ${userLocation}`);
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch user profile, using specialization only');
      }
    }
    
    console.log(`🎯 Search terms: [${searchTerms.join(', ')}]`);
    
    let jobs = [];
    try {
      // Scrape detailed jobs for the specialization from Shine.com
      console.log(`📡 Scraping detailed jobs for specialization "${field}"...`);
      // Reduced to 10 jobs per search term for faster scraping (instead of 15)
      jobs = await fetchDetailedJobsBySkills(searchTerms, 10, userLocation);
      
      // Store fetched jobs in database
      if (jobs.length > 0) {
        const storedJobs = await storeJobsInDatabase(jobs);
        console.log(`💾 Stored ${storedJobs.length} jobs in database`);
      }
      
      console.log(`✅ Found ${jobs.length} jobs for specialization "${field}"`);
    } catch (e) {
      console.error('❌ Shine.com scraping failed:', e.message);
      return res.json({ 
        status: 'error', 
        message: 'Web scraping failed - could not fetch specialization jobs', 
        data: [] 
      });
    }
    
    return res.json({ 
      status: 'ok', 
      data: jobs,
      specialization: field,
      search_terms: searchTerms,
      location: userLocation,
      total: jobs.length
    });
  } catch (err) {
    console.error('❌ Error in getJobsBySpecialization:', err);
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
 * Body: job object from frontend (scraped or API). Stores into `jobs` table and returns stored record.
 * Maps frontend job format to database schema.
 */
async function storeJob(req, res, next) {
  try {
    const job = req.body;
    if (!job) return res.status(400).json({ status: 'error', message: 'job data required' });

    console.log('📥 Received job to store:', { title: job.title, id: job.id || job._id, external_id: job.external_id || job.job_id });

    // Map frontend job format to database schema
    const jobPayload = {
      source: job.source || 'shine.com',
      external_id: job.external_id || job.job_id || job.id || null,
      title: job.title || 'Untitled Position',
      company: job.company_name || job.company || 'Unknown Company',
      company_logo: job.company_logo || job.logo || null,
      location: job.location || 'Not specified',
      job_type: job.employment_type || job.type || job.job_type || 'Full-time',
      remote: job.remote === true || job.remote === 'true' || false,
      description: job.description || '',
      skills: Array.isArray(job.skills) ? job.skills : [],
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      url: job.url || job.job_url || null,
      updated_at: new Date().toISOString()
    };

    // Check if job with this external_id already exists
    if (jobPayload.external_id) {
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('external_id', jobPayload.external_id)
        .maybeSingle();
      
      if (existing) {
        console.log(`✅ Job already exists with ID: ${existing.id}`);
        // Return the existing job
        const { data: fullJob } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', existing.id)
          .single();
        
        return res.json({ status: 'ok', job: fullJob });
      }
    }

    // Insert new job
    const { data, error } = await supabase
      .from('jobs')
      .insert(jobPayload)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error inserting job:', error.message);
      return res.status(400).json({ status: 'error', message: error.message });
    }

    console.log(`✅ Job stored with ID: ${data.id}`);
    return res.json({ status: 'ok', job: data });
  } catch (err) {
    console.error('❌ storeJob exception:', err);
    next(err);
  }
}

/**
 * Helper function to store jobs in the database (jobs table)
 * Maps Shine.com scraped job data to database schema
 */
async function storeJobsInDatabase(jobs) {
  if (!jobs || jobs.length === 0) {
    console.log('ℹ️ No jobs to store in database');
    return [];
  }

  console.log(`💾 Attempting to store ${jobs.length} jobs in database...`);
  
  const jobsToInsert = jobs.map(job => {
    // Extract skills from job description or title
    const extractedSkills = [];
    const jobText = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    
    // Common tech skills to look for
    const commonSkills = [
      'python', 'java', 'javascript', 'react', 'node', 'nodejs', 'angular', 'vue',
      'typescript', 'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker',
      'kubernetes', 'git', 'api', 'rest', 'graphql', 'html', 'css', 'ui/ux',
      'machine learning', 'ai', 'data science', 'devops', 'frontend', 'backend'
    ];
    
    commonSkills.forEach(skill => {
      if (jobText.includes(skill)) {
        extractedSkills.push(skill);
      }
    });
    
    // Parse salary if available
    let salaryMin = null;
    let salaryMax = null;
    
    if (job.salary) {
      const salaryStr = String(job.salary);
      const numbers = salaryStr.match(/\d+/g);
      if (numbers && numbers.length >= 1) {
        salaryMin = parseInt(numbers[0]) * 1000; // Assuming in thousands
        salaryMax = numbers.length >= 2 ? parseInt(numbers[1]) * 1000 : salaryMin * 1.2;
      }
    }
    
    return {
      source: 'shine.com',
      external_id: job.id || job.job_id || job.external_id || null,
      title: job.title || job.position_name || 'Untitled Position',
      company: job.company_name || job.company || 'Unknown Company',
      company_logo: job.company_logo || job.logo || null,
      location: job.location || job.city || 'Remote',
      job_type: job.employment_type || job.type || 'Full-time',
      remote: job.remote === true || job.remote === 'true' || 
              (job.location && job.location.toLowerCase().includes('remote')) ||
              (job.work_mode && job.work_mode.toLowerCase().includes('remote')),
      description: job.description || job.job_description || '',
      skills: extractedSkills.length > 0 ? extractedSkills : job.skills || ['general'],
      salary_min: salaryMin,
      salary_max: salaryMax,
      url: job.url || job.job_url || job.link || null,
      updated_at: new Date().toISOString()
    };
  });

  console.log(`📝 Prepared ${jobsToInsert.length} jobs for insertion`);

  try {
    // Check if jobs with same external_id already exist to avoid duplicates
    const jobsWithExternalId = jobsToInsert.filter(job => job.external_id);
    const jobsWithoutExternalId = jobsToInsert.filter(job => !job.external_id);

    console.log(`  - Jobs with external_id: ${jobsWithExternalId.length}`);
    console.log(`  - Jobs without external_id: ${jobsWithoutExternalId.length}`);

    let allStoredJobs = [];

    // For jobs with external_id, check if they exist first
    if (jobsWithExternalId.length > 0) {
      const externalIds = jobsWithExternalId.map(job => job.external_id);
      
      // Check which jobs already exist
      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('external_id')
        .in('external_id', externalIds);
      
      const existingIds = new Set((existingJobs || []).map(job => job.external_id));
      
      console.log(`  - Found ${existingIds.size} existing jobs in database`);
      
      // Only insert new jobs (not existing)
      const newJobs = jobsWithExternalId.filter(job => !existingIds.has(job.external_id));
      
      console.log(`  - Will insert ${newJobs.length} new jobs (${jobsWithExternalId.length - newJobs.length} already exist)`);
      
      if (newJobs.length > 0) {
        const { data: dataWithId, error: errorWithId } = await supabase
          .from('jobs')
          .insert(newJobs)
          .select();

        if (errorWithId) {
          console.error('❌ Error inserting jobs with external_id:', errorWithId.message);
        } else {
          allStoredJobs = [...allStoredJobs, ...(dataWithId || [])];
          console.log(`✅ Successfully inserted ${dataWithId?.length || 0} jobs with external_id`);
        }
      }
    }

    // Insert jobs without external_id (may create duplicates)
    if (jobsWithoutExternalId.length > 0) {
      console.log(`  - Inserting ${jobsWithoutExternalId.length} jobs without external_id (allowing duplicates)`);
      
      const { data: dataWithoutId, error: errorWithoutId } = await supabase
        .from('jobs')
        .insert(jobsWithoutExternalId)
        .select();

      if (errorWithoutId) {
        console.error('❌ Error inserting jobs without external_id:', errorWithoutId.message);
      } else {
        allStoredJobs = [...allStoredJobs, ...(dataWithoutId || [])];
        console.log(`✅ Successfully inserted ${dataWithoutId?.length || 0} jobs without external_id`);
      }
    }

    console.log(`✅ Total stored: ${allStoredJobs.length} jobs in database`);
    return allStoredJobs;
  } catch (err) {
    console.error('❌ Exception storing jobs:', err);
    return [];
  }
}

/**
 * POST /api/v1/jobs/refresh-cache/:userId
 * Refresh job recommendations cache for a specific user.
 * This endpoint can be called by a cron job or scheduler every 30 minutes.
 * 
 * Flow:
 * 1. Fetch user skills from database
 * 2. Scrape fresh jobs from Shine.com for each skill
 * 3. Store jobs in the jobs table (database)
 * 4. Store results in cache table with timestamp
 */
async function refreshJobCache(req, res, next) {
  try {
    const { userId } = req.params;
    const forceRefresh = req.body.force !== undefined ? req.body.force : true; // Default to true for manual refresh
    
    console.log(`🔄 Refreshing job cache for user: ${userId} (force: ${forceRefresh})`);
    
    // Check last refresh time (if using cache table) - only if not forcing refresh
    if (!forceRefresh) {
      const { data: cacheData } = await supabase
        .from('job_cache')
        .select('updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (cacheData) {
        const lastRefresh = new Date(cacheData.updated_at);
        const now = new Date();
        const diffMinutes = (now - lastRefresh) / (1000 * 60);
        
        if (diffMinutes < 30) {
          console.log(`ℹ️ Cache still fresh (${Math.round(diffMinutes)} min old), skipping refresh`);
          return res.json({ 
            status: 'ok', 
            message: 'Cache is still fresh',
            last_refresh: lastRefresh,
            next_refresh_in_minutes: Math.round(30 - diffMinutes)
          });
        }
      }
    } else {
      console.log('🔥 Force refresh requested - scraping fresh jobs');
    }
    
    // Fetch user skills
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, interests, technical_domains, preferred_city, location')
      .eq('id', userId)
      .maybeSingle();
    
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }
    
    const allSkills = [
      ...(profile.skills || []),
      ...(profile.interests || []),
      ...(profile.technical_domains || [])
    ];
    
    // Get user's preferred location
    const userLocation = profile?.preferred_city || profile?.location || null;
    
    if (userLocation) {
      console.log(`📍 Using user's preferred location: ${userLocation}`);
    } else {
      console.log('📍 No preferred location set, searching all locations');
    }
    
    if (allSkills.length === 0) {
      return res.json({ 
        status: 'ok', 
        message: 'No skills found for user, nothing to cache',
        data: []
      });
    }
    
    // Scrape fresh jobs from Shine.com with user's preferred location
    console.log(`📡 Scraping detailed jobs from Shine.com for ${allSkills.length} skills`);
    const jobs = await fetchDetailedJobsBySkills(allSkills, 5, userLocation); // 5 detailed jobs per skill
    
    // Store jobs in the jobs table (database)
    const storedJobs = await storeJobsInDatabase(jobs);
    console.log(`💾 Stored ${storedJobs.length} jobs in database`);
    
    // Store in cache table (create if doesn't exist)
    const cachePayload = {
      user_id: userId,
      jobs_data: jobs,
      updated_at: new Date().toISOString(),
      skills_used: allSkills
    };
    
    const { error: cacheError } = await supabase
      .from('job_cache')
      .upsert(cachePayload, { onConflict: 'user_id' });
    
    if (cacheError) {
      console.warn('⚠️ Could not update cache table:', cacheError.message);
    }
    
    console.log(`✅ Refreshed ${jobs.length} jobs for user ${userId}`);
    
    return res.json({ 
      status: 'ok', 
      message: 'Job cache refreshed successfully',
      jobs_count: jobs.length,
      stored_in_db: storedJobs.length,
      skills_used: allSkills,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error refreshing job cache:', err);
    next(err);
  }
}

/**
 * GET /api/v1/jobs/cache/:userId
 * Get cached job recommendations for a user.
 * Returns cached data if available and fresh (< 30 min old), otherwise triggers refresh.
 */
async function getCachedJobs(req, res, next) {
  try {
    const { userId } = req.params;
    
    // Try to get from cache
    const { data: cacheData } = await supabase
      .from('job_cache')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!cacheData) {
      console.log('ℹ️ No cache found, falling back to live fetch');
      // No cache, redirect to live fetch
      return getSuggestedJobs(req, res, next);
    }
    
    const lastRefresh = new Date(cacheData.updated_at);
    const now = new Date();
    const diffMinutes = (now - lastRefresh) / (1000 * 60);
    
    if (diffMinutes > 30) {
      console.log(`⚠️ Cache expired (${Math.round(diffMinutes)} min old), falling back to live fetch`);
      // Cache expired, fall back to live fetch
      return getSuggestedJobs(req, res, next);
    }
    
    console.log(`✅ Returning cached jobs (${Math.round(diffMinutes)} min old)`);
    
    // Store cached jobs in database if not already stored
    if (cacheData.jobs_data && cacheData.jobs_data.length > 0) {
      await storeJobsInDatabase(cacheData.jobs_data);
    }
    
    return res.json({
      status: 'ok',
      data: cacheData.jobs_data || [],
      cached: true,
      cache_age_minutes: Math.round(diffMinutes),
      last_refresh: lastRefresh,
      skills_used: cacheData.skills_used
    });
  } catch (err) {
    console.error('❌ Error getting cached jobs:', err);
    // Fall back to live fetch on error
    return getSuggestedJobs(req, res, next);
  }
}

// Export new handlers
module.exports = Object.assign(module.exports, { 
  getAllJobs, 
  getJobById, 
  storeJob,
  refreshJobCache,
  getCachedJobs
});
