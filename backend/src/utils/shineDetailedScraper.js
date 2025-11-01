const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape detailed job information from a Shine.com job detail page
 * Extracts comprehensive job data including title, company, skills, salary, etc.
 * 
 * @param {string} jobUrl - Full URL to the Shine.com job detail page
 * @returns {Promise<Object>} - Detailed job object
 */
async function scrapeJobDetails(jobUrl) {
  try {
    console.log(`  🔍 Scraping job details from: ${jobUrl}`);

    const response = await axios.get(jobUrl, {
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
      timeout: 20000
    });

    const $ = cheerio.load(response.data);
    
    // Extract external_id from URL
    // URL format: https://www.shine.com/jobs/python-developer/happy-square/17754504
    const urlParts = jobUrl.split('/');
    const external_id = urlParts[urlParts.length - 1] || `shine_${Date.now()}`;

    // Extract Job Title
    // Selector: #jdCardNova > div.jdCard_jdCardTop__BrNZh > div.jdCard_jdCardTopContent__oyY2r > div.jdCard_jdCardTopContentInfo__k0uFz
    let title = $('.jdCard_jdCardTopContentInfo__k0uFz h1').first().text().trim() ||
                $('h1').first().text().trim() ||
                'Job Opportunity';
    
    // Clean up title - remove promotional text and company name suffixes
    title = title
      .replace(/INTERVIEW ASSURED IN \d+ MINS/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    // If title still has company name appended, extract just the job title
    const titleMatch = title.match(/^(.+?)(?:[A-Z]{2,}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    // Extract Company Name
    // Selector: #jdCardNova > div.jdCard_jdCardTop__BrNZh > div.jdCard_jdCardTopContent__oyY2r > div.jdCard_jdCardTopContentInfo__k0uFz > span
    let company = $('.jdCard_jdCardTopContentInfo__k0uFz span').first().text().trim() ||
                  $('[class*="company"]').first().text().trim() ||
                  'Company Not Specified';
    
    // Clean company name
    company = company
      .replace(/INTERVIEW ASSURED IN \d+ MINS/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Extract Company Logo
    const company_logo = $('.jdCard_jdCardTopContent__oyY2r img').first().attr('src') ||
                        $('img[alt*="logo"]').first().attr('src') ||
                        null;

    // Extract Key Highlights (experience, salary, location)
    const keyHighlights = {};
    $('.jobdetailsNova_jdKeyHighlights__YxC7n li, [class*="keyHighlight"] li, [class*="KeyHighlight"] li').each((i, elem) => {
      const text = $(elem).text().trim().toLowerCase();
      const value = $(elem).text().trim();
      
      if (text.includes('year') || text.includes('exp')) {
        keyHighlights.experience = value;
      } else if (text.includes('₹') || text.includes('lakh') || text.includes('lpa')) {
        keyHighlights.salary = value;
      } else if (!text.includes('not disclosed') && value.length > 2) {
        keyHighlights.location = value;
      }
    });

    // Extract Location
    const location = keyHighlights.location || 
                    $('.jobdetailsNova_jdKeyHighlights__YxC7n').text().match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/)?.[0] ||
                    $('[class*="location"]').first().text().trim() ||
                    'India';

    // Extract Experience
    let experience = keyHighlights.experience || 
                     $('.jobdetailsNova_jdKeyHighlights__YxC7n').text().match(/(\d+\s*-\s*\d+\s*years?)/i)?.[0] ||
                     $('[class*="experience"]').text().match(/(\d+\s*-\s*\d+\s*years?)/i)?.[0] ||
                     '';
    
    // Clean experience text
    experience = experience.replace(/[^\d\-\syears]/gi, '').trim();

    // Extract Job Description
    // Selector: div.jobdetailsNova_jdJobDescription__6JHQZ
    const description = $('.jobdetailsNova_jdJobDescription__6JHQZ').text().trim() ||
                       $('[class*="jobDescription"]').text().trim() ||
                       $('[class*="JobDescription"]').text().trim() ||
                       '';

    // Extract Skills
    // Selector: div.jdSkillsNova_jdSkillsCardTop__uVgsq > ul > li
    const skills = [];
    $('.jdSkillsNova_jdSkillsCardTop__uVgsq ul li, [class*="skill"] li, [class*="Skill"] li').each((i, elem) => {
      const skill = $(elem).text().trim();
      if (skill && skill.length > 1 && skill.length < 50) {
        skills.push(skill);
      }
    });

    // Also check for skills in other common locations
    if (skills.length === 0) {
      $('[class*="tag"], [class*="badge"]').each((i, elem) => {
        const skill = $(elem).text().trim();
        if (skill && skill.length > 1 && skill.length < 50) {
          skills.push(skill);
        }
      });
    }

    // Extract Salary Information
    let salary_min = null;
    let salary_max = null;
    const salaryText = keyHighlights.salary || 
                      $('.jobdetailsNova_jdKeyHighlights__YxC7n').text() ||
                      $('[class*="salary"]').text() ||
                      '';
    
    // Parse salary from text like "₹6,00,000 - ₹10,00,000" or "6-10 LPA" or "Rs 4.5 - 10 Lakh/Yr"
    // Try format: "₹6,00,000 - ₹10,00,000" or numbers with commas
    let salaryMatch = salaryText.match(/₹?\s*([\d,]+)\s*-\s*₹?\s*([\d,]+)/);
    if (salaryMatch) {
      const min = salaryMatch[1].replace(/,/g, '');
      const max = salaryMatch[2].replace(/,/g, '');
      
      // If the number is less than 1000, it's in lakhs, convert to rupees
      salary_min = parseInt(min) < 1000 ? parseInt(min) * 100000 : parseInt(min);
      salary_max = parseInt(max) < 1000 ? parseInt(max) * 100000 : parseInt(max);
    } else {
      // Try to parse "6-10 LPA" or "6-10 Lakh" format
      const lpaMatch = salaryText.match(/([\d.]+)\s*-\s*([\d.]+)\s*(?:LPA|lpa|Lpa|Lakh|lakh)/i);
      if (lpaMatch) {
        salary_min = Math.round(parseFloat(lpaMatch[1]) * 100000); // Convert lakhs to rupees
        salary_max = Math.round(parseFloat(lpaMatch[2]) * 100000);
      }
    }

    // Detect Remote Work
    const pageText = $('body').text().toLowerCase();
    const remote = pageText.includes('remote') || 
                   pageText.includes('work from home') || 
                   pageText.includes('wfh') ||
                   location.toLowerCase().includes('remote');

    // Detect Job Type
    let job_type = 'Full-time'; // Default
    if (pageText.includes('part-time') || pageText.includes('part time')) {
      job_type = 'Part-time';
    } else if (pageText.includes('contract')) {
      job_type = 'Contract';
    } else if (pageText.includes('internship')) {
      job_type = 'Internship';
    } else if (pageText.includes('freelance')) {
      job_type = 'Freelance';
    }

    // Build the complete job object
    const jobDetails = {
      external_id: external_id,
      title: title,
      company: company,
      company_name: company,
      company_logo: company_logo,
      location: location,
      experience: experience,
      job_type: job_type,
      employment_type: job_type,
      type: job_type,
      remote: remote,
      description: description || `${title} position at ${company}. ${experience ? `Experience: ${experience}.` : ''} Located in ${location}.`,
      skills: skills.length > 0 ? [...new Set(skills)] : ['General'], // Deduplicate skills
      salary: salaryText || 'Not disclosed',
      salary_min: salary_min,
      salary_max: salary_max,
      url: jobUrl,
      job_url: jobUrl,
      source: 'shine.com',
      created_at: new Date().toISOString(),
      posted_date: new Date().toISOString(),
      fetched_at: new Date().toISOString()
    };

    console.log(`  ✅ Extracted job: ${title} at ${company}`);
    return jobDetails;

  } catch (error) {
    console.error(`  ❌ Error scraping job details from ${jobUrl}:`, error.message);
    return null;
  }
}

/**
 * Enhanced scraper that gets job listings and then scrapes each job's detail page
 * 
 * @param {Object} options - Search parameters
 * @param {string} options.query - Search query (job title, skill)
 * @param {string} options.location - Location filter
 * @param {number} options.per_page - Number of jobs to scrape in detail
 * @returns {Promise<Array>} - Array of detailed job objects
 */
async function scrapeJobsWithDetails({ query = '', location = '', per_page = 5 } = {}) {
  try {
    console.log(`\n🔍 Starting detailed scrape for "${query}" in ${location || 'all locations'}`);
    
    // Step 1: Get job listing page
    const searchQuery = query.toLowerCase().replace(/\s+/g, '-');
    const locationQuery = location ? `-in-${location.toLowerCase().replace(/\s+/g, '-')}` : '';
    const searchUrl = `https://www.shine.com/job-search/${searchQuery}-jobs${locationQuery}`;
    
    console.log(`  📄 Fetching job listings from: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // Step 2: Extract job URLs from listing page
    const jobUrls = [];
    $('a[href*="/jobs/"]').each((index, element) => {
      if (jobUrls.length >= per_page) return false;
      
      const href = $(element).attr('href');
      if (href && href.includes('/jobs/') && !href.includes('?')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.shine.com${href}`;
        
        // Avoid duplicates
        if (!jobUrls.includes(fullUrl) && fullUrl.match(/\/jobs\/[^/]+\/[^/]+\/\d+/)) {
          jobUrls.push(fullUrl);
        }
      }
    });

    console.log(`  📋 Found ${jobUrls.length} job URLs to scrape in detail`);

    // Step 3: Scrape each job detail page
    const detailedJobs = [];
    for (let i = 0; i < Math.min(jobUrls.length, per_page); i++) {
      const jobUrl = jobUrls[i];
      
      try {
        const jobDetails = await scrapeJobDetails(jobUrl);
        if (jobDetails) {
          detailedJobs.push({
            ...jobDetails,
            matched_skill: query
          });
        }

        // Add delay between requests to be polite
        if (i < jobUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error) {
        console.error(`  ⚠️ Failed to scrape ${jobUrl}:`, error.message);
        continue; // Skip this job and continue with others
      }
    }

    console.log(`  ✅ Successfully scraped ${detailedJobs.length} detailed jobs\n`);
    return detailedJobs;

  } catch (error) {
    console.error(`  ❌ Error in scrapeJobsWithDetails:`, error.message);
    return [];
  }
}

/**
 * Scrape detailed jobs for multiple skills
 * 
 * @param {Array<string>} skills - Array of skills to search for
 * @param {number} jobsPerSkill - Jobs to scrape per skill (default: 3)
 * @param {string} location - Optional location filter
 * @returns {Promise<Array>} - Array of all scraped jobs
 */
async function fetchDetailedJobsBySkills(skills = [], jobsPerSkill = 3, location = null) {
  if (!Array.isArray(skills) || skills.length === 0) {
    console.log('ℹ️ No skills provided');
    return [];
  }

  const uniqueSkills = [...new Set(skills)];
  console.log(`\n🎯 Scraping detailed jobs for ${uniqueSkills.length} skills: ${uniqueSkills.join(', ')}`);

  const allJobs = [];
  const seenIds = new Set();

  for (const skill of uniqueSkills) {
    try {
      const jobs = await scrapeJobsWithDetails({
        query: skill,
        location: location,
        per_page: jobsPerSkill
      });

      // Deduplicate
      for (const job of jobs) {
        const jobId = job.external_id || job.id;
        if (!seenIds.has(jobId)) {
          seenIds.add(jobId);
          allJobs.push(job);
        }
      }

      // Delay between skills
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds

    } catch (error) {
      console.error(`  ❌ Error scraping skill "${skill}":`, error.message);
      continue;
    }
  }

  console.log(`\n✅ Total detailed jobs scraped: ${allJobs.length}\n`);
  return allJobs;
}

module.exports = {
  scrapeJobDetails,
  scrapeJobsWithDetails,
  fetchDetailedJobsBySkills
};
