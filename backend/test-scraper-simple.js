/**
 * Simple test for Shine.com detailed scraper
 * Tests scraping without database operations
 */

const { scrapeJobDetails, scrapeJobsWithDetails } = require('./src/utils/shineDetailedScraper');

async function testScraper() {
  console.log('🧪 Testing Shine.com Detailed Job Scraper\n');
  console.log('='.repeat(80));

  // Test 1: Scrape a single job detail page
  console.log('\n📋 Test 1: Scrape Single Job Detail Page');
  console.log('-'.repeat(80));
  try {
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
      console.log(`  Salary Min: ${jobDetails.salary_min}`);
      console.log(`  Salary Max: ${jobDetails.salary_max}`);
      console.log(`  Skills (${jobDetails.skills.length}): ${jobDetails.skills.join(', ')}`);
      console.log(`  Description preview: ${jobDetails.description.substring(0, 200)}...`);
      console.log(`  Description length: ${jobDetails.description.length} characters`);
      console.log(`  URL: ${jobDetails.url}`);
      console.log(`  External ID: ${jobDetails.external_id}`);
      console.log(`  Company Logo: ${jobDetails.company_logo || 'N/A'}`);
    } else {
      console.log('❌ Failed to scrape job details');
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    console.error(error.stack);
  }

  // Test 2: Scrape jobs with details for a single skill
  console.log('\n📋 Test 2: Scrape Multiple Jobs with Details for "Python"');
  console.log('-'.repeat(80));
  try {
    const pythonJobs = await scrapeJobsWithDetails({
      query: 'Python',
      per_page: 2 // Only get 2 jobs to test quickly
    });
    
    console.log(`✅ Scraped ${pythonJobs.length} Python jobs with full details`);
    
    if (pythonJobs.length > 0) {
      const job = pythonJobs[0];
      console.log('\nFirst job sample:');
      console.log(`  Title: ${job.title}`);
      console.log(`  Company: ${job.company}`);
      console.log(`  Location: ${job.location}`);
      console.log(`  Experience: ${job.experience}`);
      console.log(`  Skills: ${job.skills.slice(0, 5).join(', ')}`);
      console.log(`  Salary: ${job.salary} (Min: ${job.salary_min}, Max: ${job.salary_max})`);
      console.log(`  Description length: ${job.description.length} characters`);
      console.log(`  External ID: ${job.external_id}`);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests completed!');
}

testScraper().catch(console.error);
