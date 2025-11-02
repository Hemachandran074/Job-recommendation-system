/**
 * Test script to verify location-based job scraping
 */

const { scrapeJobsWithDetails, fetchDetailedJobsBySkills } = require('./src/utils/shineDetailedScraper');

async function testLocationScraping() {
  console.log('🧪 Testing Location-Based Job Scraping\n');
  console.log('='.repeat(80));

  // Test 1: Scrape jobs without location (all locations)
  console.log('\n📋 Test 1: Scrape Python jobs - All Locations');
  console.log('-'.repeat(80));
  try {
    const allLocationJobs = await scrapeJobsWithDetails({
      query: 'Python',
      location: null,
      per_page: 2
    });
    
    console.log(`✅ Found ${allLocationJobs.length} jobs (all locations)`);
    if (allLocationJobs.length > 0) {
      console.log(`Sample job: ${allLocationJobs[0].title} - ${allLocationJobs[0].location}`);
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Scrape jobs with specific location (Bangalore)
  console.log('\n📋 Test 2: Scrape Python jobs - Bangalore Only');
  console.log('-'.repeat(80));
  try {
    const bangaloreJobs = await scrapeJobsWithDetails({
      query: 'Python',
      location: 'Bangalore',
      per_page: 2
    });
    
    console.log(`✅ Found ${bangaloreJobs.length} jobs in Bangalore`);
    if (bangaloreJobs.length > 0) {
      bangaloreJobs.forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.location} (${job.company})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Scrape jobs with different location (Mumbai)
  console.log('\n📋 Test 3: Scrape Python jobs - Mumbai Only');
  console.log('-'.repeat(80));
  try {
    const mumbaiJobs = await scrapeJobsWithDetails({
      query: 'Python',
      location: 'Mumbai',
      per_page: 2
    });
    
    console.log(`✅ Found ${mumbaiJobs.length} jobs in Mumbai`);
    if (mumbaiJobs.length > 0) {
      mumbaiJobs.forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.location} (${job.company})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test 4: Multi-skill with location
  console.log('\n📋 Test 4: Multiple Skills with Location (Bangalore)');
  console.log('-'.repeat(80));
  try {
    const multiSkillJobs = await fetchDetailedJobsBySkills(['Python', 'React'], 1, 'Bangalore');
    
    console.log(`✅ Found ${multiSkillJobs.length} total jobs for Python & React in Bangalore`);
    if (multiSkillJobs.length > 0) {
      multiSkillJobs.forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.location} (${job.company})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Location-based scraping tests completed!');
}

testLocationScraping().catch(console.error);
