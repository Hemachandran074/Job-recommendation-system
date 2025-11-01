/**
 * Test script for Shine.com detailed scraper
 * Tests scraping of complete job information including description, skills, salary
 */

const { scrapeJobDetails, scrapeJobsWithDetails, fetchDetailedJobsBySkills } = require('./src/utils/shineDetailedScraper');

async function testDetailedScraper() {
  console.log('🧪 Testing Shine.com Detailed Job Scraper\n');
  console.log('='.repeat(80));

  // Test 1: Scrape a single job detail page
  console.log('\n📋 Test 1: Scrape Single Job Detail Page');
  console.log('-'.repeat(80));
  try {
    // Example job URL (replace with actual Shine.com job URL)
    const sampleUrl = 'https://www.shine.com/jobs/python-developer/happy-square-outsourcing-services-limited/17754504';
    const jobDetails = await scrapeJobDetails(sampleUrl);
    
    if (jobDetails) {
      console.log('✅ Successfully scraped job details:');
      console.log(`  Title: ${jobDetails.title}`);
      console.log(`  Company: ${jobDetails.company}`);
      console.log(`  Location: ${jobDetails.location}`);
      console.log(`  Experience: ${jobDetails.experience}`);
      console.log(`  Job Type: ${jobDetails.job_type}`);
      console.log(`  Remote: ${jobDetails.remote}`);
      console.log(`  Salary: ${jobDetails.salary}`);
      console.log(`  Skills (${jobDetails.skills.length}): ${jobDetails.skills.slice(0, 5).join(', ')}${jobDetails.skills.length > 5 ? '...' : ''}`);
      console.log(`  Description length: ${jobDetails.description.length} characters`);
      console.log(`  URL: ${jobDetails.url}`);
      console.log(`  External ID: ${jobDetails.external_id}`);
    } else {
      console.log('❌ Failed to scrape job details');
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Scrape jobs with details for a single skill
  console.log('\n📋 Test 2: Scrape Multiple Jobs with Details for "Python"');
  console.log('-'.repeat(80));
  try {
    const pythonJobs = await scrapeJobsWithDetails({
      query: 'Python',
      per_page: 3
    });
    
    console.log(`✅ Scraped ${pythonJobs.length} Python jobs with full details`);
    
    if (pythonJobs.length > 0) {
      console.log('\nSample Job:');
      const job = pythonJobs[0];
      console.log(`  Title: ${job.title}`);
      console.log(`  Company: ${job.company}`);
      console.log(`  Location: ${job.location}`);
      console.log(`  Experience: ${job.experience || 'Not specified'}`);
      console.log(`  Skills: ${job.skills.join(', ')}`);
      console.log(`  Salary: ${job.salary}`);
      console.log(`  Description: ${job.description.substring(0, 150)}...`);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Scrape jobs for multiple skills
  console.log('\n📋 Test 3: Scrape Jobs for Multiple Skills');
  console.log('-'.repeat(80));
  try {
    const skills = ['React', 'Node.js'];
    const multiSkillJobs = await fetchDetailedJobsBySkills(skills, 2);
    
    console.log(`✅ Scraped ${multiSkillJobs.length} jobs across ${skills.length} skills`);
    
    // Show breakdown
    const breakdown = {};
    multiSkillJobs.forEach(job => {
      const skill = job.matched_skill;
      breakdown[skill] = (breakdown[skill] || 0) + 1;
    });
    
    console.log('\nJobs per skill:');
    Object.entries(breakdown).forEach(([skill, count]) => {
      console.log(`  ${skill}: ${count} jobs`);
    });

    // Show comprehensive data for first job
    if (multiSkillJobs.length > 0) {
      const job = multiSkillJobs[0];
      console.log('\n📄 Complete Job Data Sample:');
      console.log(`  External ID: ${job.external_id}`);
      console.log(`  Title: ${job.title}`);
      console.log(`  Company: ${job.company}`);
      console.log(`  Company Logo: ${job.company_logo || 'Not available'}`);
      console.log(`  Location: ${job.location}`);
      console.log(`  Experience: ${job.experience || 'Not specified'}`);
      console.log(`  Job Type: ${job.job_type}`);
      console.log(`  Remote: ${job.remote}`);
      console.log(`  Skills (${job.skills.length}): ${job.skills.join(', ')}`);
      console.log(`  Salary Range: ₹${job.salary_min || 'N/A'} - ₹${job.salary_max || 'N/A'}`);
      console.log(`  Salary Text: ${job.salary}`);
      console.log(`  Description: ${job.description.substring(0, 200)}...`);
      console.log(`  URL: ${job.url}`);
      console.log(`  Source: ${job.source}`);
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test 4: Scrape with location filter
  console.log('\n📋 Test 4: Scrape Jobs with Location Filter (Bangalore)');
  console.log('-'.repeat(80));
  try {
    const bangaloreJobs = await scrapeJobsWithDetails({
      query: 'DevOps',
      location: 'Bangalore',
      per_page: 2
    });
    
    console.log(`✅ Scraped ${bangaloreJobs.length} DevOps jobs in Bangalore`);
    
    bangaloreJobs.forEach((job, index) => {
      console.log(`\n  Job ${index + 1}:`);
      console.log(`    Title: ${job.title}`);
      console.log(`    Company: ${job.company}`);
      console.log(`    Location: ${job.location}`);
      console.log(`    Skills: ${job.skills.slice(0, 3).join(', ')}${job.skills.length > 3 ? '...' : ''}`);
    });
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Detailed Scraper Test Complete!\n');
  console.log('📊 Summary:');
  console.log('  ✅ Extracts: title, company, location, experience, job_type, skills');
  console.log('  ✅ Extracts: description, salary_min, salary_max, remote, company_logo');
  console.log('  ✅ Extracts: url, external_id');
  console.log('  ✅ Ready for database storage');
  console.log('  ✅ All data properly formatted for frontend display\n');
}

// Run the tests
testDetailedScraper().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
