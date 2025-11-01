const { supabase } = require('../config/supabaseClient');
// Use Shine.com detailed scraper for comprehensive job data
const { fetchDetailedJobsBySkills } = require('../utils/shineDetailedScraper');
const { deduplicateJobs } = require('../utils/shineScraper');

/**
 * Helper function to store jobs in the database (jobs table)
 * Maps Shine.com scraped job data to database schema
 */
async function storeJobsInDatabase(jobs) {
  if (!jobs || jobs.length === 0) {
    console.log('ℹ️ No jobs to store in database');
    return [];
  }

  console.log(`💾 Storing ${jobs.length} jobs in database...`);
  
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

  try {
    // Check if jobs with same external_id already exist to avoid duplicates
    const jobsWithExternalId = jobsToInsert.filter(job => job.external_id);
    const jobsWithoutExternalId = jobsToInsert.filter(job => !job.external_id);

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
      
      // Only insert new jobs (not existing)
      const newJobs = jobsWithExternalId.filter(job => !existingIds.has(job.external_id));
      
      if (newJobs.length > 0) {
        const { data: dataWithId, error: errorWithId } = await supabase
          .from('jobs')
          .insert(newJobs)
          .select();

        if (errorWithId) {
          console.error('❌ Error inserting jobs with external_id:', errorWithId.message);
        } else {
          allStoredJobs = [...allStoredJobs, ...(dataWithId || [])];
        }
      }
      
      console.log(`ℹ️ ${existingIds.size} jobs already exist, inserted ${newJobs.length} new jobs`);
    }

    // Insert jobs without external_id (may create duplicates)
    if (jobsWithoutExternalId.length > 0) {
      const { data: dataWithoutId, error: errorWithoutId } = await supabase
        .from('jobs')
        .insert(jobsWithoutExternalId)
        .select();

      if (errorWithoutId) {
        console.error('❌ Error inserting jobs without external_id:', errorWithoutId.message);
      } else {
        allStoredJobs = [...allStoredJobs, ...(dataWithoutId || [])];
      }
    }

    console.log(`✅ Successfully stored ${allStoredJobs.length} jobs in database`);
    return allStoredJobs;
  } catch (err) {
    console.error('❌ Exception storing jobs:', err);
    return [];
  }
}

/**
 * POST /api/v1/recommendations
 * Get personalized job recommendations based on user's skills from database
 * Body: { user_id, limit }
 */
async function getPersonalizedRecommendations(req, res) {
  try {
    const { user_id, limit = 20 } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'user_id is required' 
      });
    }

    console.log(`🎯 Fetching recommendations for user: ${user_id}`);

    // 1. Fetch user profile with skills from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('skills, interests, technical_domains')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return res.status(404).json({ 
        status: 'error', 
        message: 'User profile not found' 
      });
    }

    // 2. Combine all skills from different fields
    const allSkills = [
      ...(profile.skills || []),
      ...(profile.interests || []),
      ...(profile.technical_domains || [])
    ].filter(Boolean); // Remove null/undefined values

    if (allSkills.length === 0) {
      console.log('ℹ️ User has no skills defined, returning empty recommendations');
      return res.json({ 
        status: 'ok', 
        recommendations: [],
        message: 'No skills found in user profile. Please update your profile with skills.'
      });
    }

    console.log(`🎯 User skills (${allSkills.length}):`, allSkills);

    // 3. Fetch detailed jobs dynamically for each skill
    const rawJobs = await fetchDetailedJobsBySkills(allSkills, 2); // 2 detailed jobs per skill

    if (rawJobs.length === 0) {
      console.log('ℹ️ No jobs found for user skills');
      return res.json({ 
        status: 'ok', 
        recommendations: [],
        message: 'No matching jobs found at the moment. Try again later.'
      });
    }

    // 3.5 Store fetched jobs in database
    const storedJobs = await storeJobsInDatabase(rawJobs);
    console.log(`💾 Stored ${storedJobs.length} jobs in database`);

    // 4. Deduplicate jobs
    const uniqueJobs = deduplicateJobs(rawJobs);
    console.log(`✅ Deduplicated to ${uniqueJobs.length} unique jobs`);

    // 5. Score jobs by skill match
    const scoredJobs = uniqueJobs.map(job => {
      // Count how many user skills match this job
      const jobText = `${job.title || ''} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();
      const matchCount = allSkills.filter(skill => 
        jobText.includes(skill.toLowerCase())
      ).length;

      return {
        job: {
          _id: job.job_id || job.id || job._id || `job_${Date.now()}_${Math.random()}`,
          id: job.job_id || job.id || job._id || `job_${Date.now()}_${Math.random()}`,
          title: job.title || job.job_title || 'Untitled Position',
          company_name: job.company || job.employer_name || job.company_name || 'Unknown Company',
          location: job.location || job.job_location || 'Not specified',
          description: job.description || job.job_description || '',
          skills_required: job.skills || job.required_skills || [],
          type: job.job_type || job.employment_type || 'Full Time',
          salary: job.salary || job.salary_range || 'Competitive',
          url: job.url || job.job_apply_link || '',
          created_at: job.created_at || new Date().toISOString(),
          matched_skill: job.matched_skill || ''
        },
        match_score: matchCount
      };
    });

    // 6. Sort by match_score (highest first) and limit results
    const topRecommendations = scoredJobs
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    console.log(`✅ Returning ${topRecommendations.length} personalized recommendations`);

    return res.json({ 
      status: 'ok', 
      recommendations: topRecommendations,
      metadata: {
        total_found: uniqueJobs.length,
        returned: topRecommendations.length,
        user_skills_count: allSkills.length,
        fetched_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in getPersonalizedRecommendations:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to fetch recommendations' 
    });
  }
}

module.exports = { getPersonalizedRecommendations };
