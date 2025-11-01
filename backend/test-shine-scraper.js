/**
 * Test script for Shine.com web scraper
 * Tests various search queries and locations
 */

const { scrapeShineJobs, fetchJobsByUserSkills } = require('./src/utils/shineScraper');

async function testScraper() {
  console.log('🧪 Testing Shine.com Web Scraper\n');
  console.log('='.repeat(60));

  // Test 1: Single skill search
  console.log('\n📋 Test 1: Search for "Python" jobs');
  console.log('-'.repeat(60));
  try {
    const pythonJobs = await scrapeShineJobs({ 
      query: 'Python',
      per_page: 5
    });
    console.log(`✅ Found ${pythonJobs.length} Python jobs`);
    if (pythonJobs.length > 0) {
      console.log('\nSample job:');
      console.log(`  Title: ${pythonJobs[0].title}`);
      console.log(`  Company: ${pythonJobs[0].company}`);
      console.log(`  Location: ${pythonJobs[0].location}`);
      console.log(`  URL: ${pythonJobs[0].url}`);
    }
  } catch (error) {
    console.error(`❌ Test 1 failed:`, error.message);
  }

  // Test 2: Search with location
  console.log('\n📋 Test 2: Search for "React" jobs in "Bangalore"');
  console.log('-'.repeat(60));
  try {
    const reactJobs = await scrapeShineJobs({ 
      query: 'React',
      location: 'Bangalore',
      per_page: 5
    });
    console.log(`✅ Found ${reactJobs.length} React jobs in Bangalore`);
    if (reactJobs.length > 0) {
      console.log('\nSample job:');
      console.log(`  Title: ${reactJobs[0].title}`);
      console.log(`  Company: ${reactJobs[0].company}`);
      console.log(`  Location: ${reactJobs[0].location}`);
    }
  } catch (error) {
    console.error(`❌ Test 2 failed:`, error.message);
  }

  // Test 3: Multiple skills
  console.log('\n📋 Test 3: Fetch jobs for multiple skills');
  console.log('-'.repeat(60));
  try {
    const skills = ['Python', 'React', 'Node.js'];
    const multiSkillJobs = await fetchJobsByUserSkills(skills, 3);
    console.log(`✅ Found ${multiSkillJobs.length} jobs for skills: ${skills.join(', ')}`);
    
    // Show breakdown by skill
    const breakdown = {};
    multiSkillJobs.forEach(job => {
      const skill = job.matched_skill;
      breakdown[skill] = (breakdown[skill] || 0) + 1;
    });
    console.log('\nJobs per skill:');
    Object.entries(breakdown).forEach(([skill, count]) => {
      console.log(`  ${skill}: ${count} jobs`);
    });
  } catch (error) {
    console.error(`❌ Test 3 failed:`, error.message);
  }

  // Test 4: Search for UI/UX jobs
  console.log('\n📋 Test 4: Search for "UI/UX" jobs');
  console.log('-'.repeat(60));
  try {
    const uiuxJobs = await scrapeShineJobs({ 
      query: 'UI UX',
      per_page: 5
    });
    console.log(`✅ Found ${uiuxJobs.length} UI/UX jobs`);
  } catch (error) {
    console.error(`❌ Test 4 failed:`, error.message);
  }

  // Test 5: Search in Mumbai
  console.log('\n📋 Test 5: Search for "DevOps" jobs in "Mumbai"');
  console.log('-'.repeat(60));
  try {
    const devopsJobs = await scrapeShineJobs({ 
      query: 'DevOps',
      location: 'Mumbai',
      per_page: 5
    });
    console.log(`✅ Found ${devopsJobs.length} DevOps jobs in Mumbai`);
  } catch (error) {
    console.error(`❌ Test 5 failed:`, error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Shine.com Scraper Test Complete!\n');
}

// Run the tests
testScraper().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
