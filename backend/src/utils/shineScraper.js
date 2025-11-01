const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Web scraper for Shine.com job listings
 * Scrapes jobs from shine.com based on search query and location
 * 
 * @param {Object} options - Search parameters
 * @param {string} options.query - Search query (job title, skill, etc.)
 * @param {string} options.location - Location (e.g., "Mumbai", "Bangalore", "Delhi")
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {number} options.per_page - Results per page (default: 20)
 * @returns {Promise<Array>} - Array of job objects
 */
async function scrapeShineJobs({ 
  query = '', 
  location = '', 
  offset = 0, 
  per_page = 20
} = {}) {
  try {
    // Shine.com search URL format
    // Example: https://www.shine.com/job-search/python-jobs-in-bangalore
    const searchQuery = query.toLowerCase().replace(/\s+/g, '-');
    const locationQuery = location ? `-in-${location.toLowerCase().replace(/\s+/g, '-')}` : '';
    
    // Calculate page number (Shine uses page numbers, not offsets)
    const pageNum = Math.floor(offset / per_page) + 1;
    
    const searchUrl = location 
      ? `https://www.shine.com/job-search/${searchQuery}-jobs${locationQuery}?page=${pageNum}`
      : `https://www.shine.com/job-search/${searchQuery}-jobs?page=${pageNum}`;

    console.log(`  🌐 Scraping Shine.com: ${searchUrl}`);

    // Make request with proper headers to avoid blocking
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // Debug: Check if we got the page
    console.log(`  📄 Page loaded, HTML length: ${response.data.length} characters`);

    // Try multiple selector patterns for Shine.com job listings
    const possibleSelectors = [
      '.job-card',
      '.jobCard', 
      '.job_container',
      '[data-job-id]',
      '.search-result-wrapper',
      '.listRow',
      '.job-listing',
      'article',
      '[class*="job"]',
      '[class*="Job"]'
    ];

    let jobElements = $();
    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`  ✅ Found ${elements.length} elements using selector: "${selector}"`);
        jobElements = elements;
        break;
      }
    }

    if (jobElements.length === 0) {
      console.log(`  ⚠️ No job elements found with any selector. Trying alternative scraping...`);
      
      // Alternative: Look for any links that might be job links
      const jobLinks = $('a[href*="/job/"], a[href*="/jobs/"]');
      console.log(`  📎 Found ${jobLinks.length} job links`);
      
      if (jobLinks.length === 0) {
        console.log(`  ℹ️ Page might require JavaScript or have anti-scraping measures`);
        return [];
      }
      
      // Process job links
      jobLinks.each((index, element) => {
        if (index >= per_page) return false; // Limit results
        
        const $link = $(element);
        const title = $link.text().trim() || $link.attr('title') || 'Job Opportunity';
        const url = $link.attr('href');
        const jobUrl = url && url.startsWith('http') ? url : `https://www.shine.com${url}`;
        
        const jobId = `shine_${Date.now()}_${index}`;
        
        jobs.push({
          id: jobId,
          job_id: jobId,
          external_id: jobId,
          title: title,
          company: 'Company Not Specified',
          company_name: 'Company Not Specified',
          location: location || 'India',
          description: `Job opportunity: ${title}`,
          skills: [query],
          url: jobUrl,
          job_url: jobUrl,
          source: 'shine.com',
          remote: false,
          employment_type: 'Full-time',
          type: 'Full-time',
          salary: 'Not disclosed',
          posted_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      });
      
      console.log(`  ✅ Scraped ${jobs.length} jobs from links`);
      return jobs.slice(0, per_page);
    }

    // Shine.com job card parsing
    jobElements.each((index, element) => {
      if (jobs.length >= per_page) return false; // Stop when we have enough jobs
      
      try {
        const $card = $(element);

        // Extract job details with improved selectors
        const titleEl = $card.find('h2, h3, .job-title, [class*="title"]').first();
        const title = titleEl.text().trim() || 
                     $card.find('a').first().text().trim() ||
                     'Job Opportunity';
        
        // Skip if title is too short or generic
        if (!title || title.length < 3 || title === 'Job Opportunity') {
          return; // continue to next
        }
        
        const company = $card.find('.company-name, .companyName, .company, [class*="company"]').first().text().trim() ||
                       'Company Not Specified';
        
        const locationText = $card.find('.location, .job-location, [class*="location"]').first().text().trim() ||
                            location || 'India';
        
        const experience = $card.find('.experience, [class*="experience"]').first().text().trim() || '';
        
        const salary = $card.find('.salary, [class*="salary"]').first().text().trim() || 'Not disclosed';
        
        const description = $card.find('.description, [class*="description"]').first().text().trim().substring(0, 500) || 
                           `${title} position at ${company}`;
        
        // Get job URL - look for the main job link
        const jobLink = $card.find('a[href*="/jobs/"]').first().attr('href') ||
                       $card.find('a').first().attr('href') ||
                       '';
        
        const jobUrl = jobLink && jobLink.startsWith('http') 
          ? jobLink 
          : jobLink ? `https://www.shine.com${jobLink}` : '';

        // Only add if we have a valid URL
        if (!jobUrl) return; // continue to next

        // Generate unique job ID from URL or title+company
        const jobId = jobUrl.split('/').pop() || 
                     `shine_${title.replace(/\s+/g, '_')}_${company.replace(/\s+/g, '_')}_${Date.now()}`;

        // Extract skills
        const skills = [];
        $card.find('.skill, .tag, [class*="skill"]').each((i, skillEl) => {
          const skill = $(skillEl).text().trim();
          if (skill && skill.length > 1 && skill.length < 30) {
            skills.push(skill);
          }
        });

        // Build job object
        jobs.push({
          id: jobId,
          job_id: jobId,
          external_id: jobId,
          title: title,
          company: company,
          company_name: company,
          location: locationText,
          experience: experience,
          salary: salary,
          description: description,
          skills: skills.length > 0 ? skills : [query],
          url: jobUrl,
          job_url: jobUrl,
          source: 'shine.com',
          remote: locationText.toLowerCase().includes('remote') || locationText.toLowerCase().includes('wfh') || locationText.toLowerCase().includes('work from home'),
          employment_type: 'Full-time',
          type: 'Full-time',
          posted_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (err) {
        // Skip this card if parsing fails
        return; // continue to next
      }
    });

    console.log(`  ✅ Scraped ${jobs.length} jobs from Shine.com`);
    
    // Limit to requested per_page
    return jobs.slice(0, per_page);

  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`  ℹ️ No jobs found for query: ${query} in ${location || 'any location'}`);
      return [];
    }
    
    console.error(`  ❌ Shine.com scraping error: ${error.message}`);
    if (error.response?.status) {
      console.error(`  📛 HTTP Status: ${error.response.status}`);
    }
    
    // Return empty array instead of throwing to allow other skills to continue
    return [];
  }
}

/**
 * Fetch jobs dynamically for multiple skills (user's skill array).
 * Loops through each skill, scrapes Shine.com, and removes duplicates.
 * 
 * @param {Array<string>} skills - Array of user skills from database
 * @param {number} jobsPerSkill - Max jobs to fetch per skill (default: 10)
 * @param {string} location - Optional location filter (e.g., "Bangalore", "Mumbai")
 * @returns {Promise<Array>} - Merged and deduplicated job listings
 */
async function fetchJobsByUserSkills(skills = [], jobsPerSkill = 10, location = null) {
  if (!Array.isArray(skills) || skills.length === 0) {
    console.log('ℹ️ No skills provided, returning empty job list');
    return [];
  }

  // Remove duplicates from skills array
  const uniqueSkills = [...new Set(skills)];
  console.log(`🔍 Scraping Shine.com for ${uniqueSkills.length} unique skills:`, uniqueSkills);

  const allJobs = [];
  const seenIds = new Set();

  // Loop through each skill and scrape jobs
  for (const skill of uniqueSkills) {
    try {
      console.log(`  📡 Scraping jobs for skill: "${skill}"${location ? ` in ${location}` : ''}`);
      
      // Scrape Shine.com
      const jobs = await scrapeShineJobs({ 
        query: skill,
        location: location,
        offset: 0,
        per_page: jobsPerSkill
      });

      console.log(`  ✅ Found ${jobs.length} jobs for "${skill}"`);

      // Add jobs to result array, deduplicating by job_id
      for (const job of jobs) {
        const jobId = job.job_id || job.id || job.external_id || `${job.title}_${job.company}`;
        
        if (!seenIds.has(jobId)) {
          seenIds.add(jobId);
          allJobs.push({
            ...job,
            matched_skill: skill, // Track which skill matched this job
            fetched_at: new Date().toISOString()
          });
        }
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Error scraping jobs for skill "${skill}":`, error.message);
      // Continue with other skills even if one fails
    }
  }

  console.log(`✅ Total unique jobs scraped from Shine.com: ${allJobs.length}`);
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

/**
 * Alias for backward compatibility
 */
async function fetchJobs(options) {
  return scrapeShineJobs(options);
}

module.exports = { 
  fetchJobs, 
  scrapeShineJobs,
  fetchJobsByUserSkills, 
  deduplicateJobs 
};
