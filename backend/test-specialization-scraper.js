/**
 * Test script for specialization-based job scraping
 */

const axios = require('axios');

const API_URL = 'http://127.0.0.1:4000/api/v1';

async function testSpecializationScraping() {
  console.log('🧪 Testing Specialization-Based Job Scraping\n');
  console.log('='.repeat(80));

  // Test 1: Scrape jobs for "DevOps" specialization
  console.log('\n📋 Test 1: Scrape DevOps Jobs (No User ID)');
  console.log('-'.repeat(80));
  try {
    const response = await axios.get(`${API_URL}/jobs/specialization/DevOps`, {
      timeout: 60000 // 60 seconds for scraping
    });
    
    console.log(`✅ Status: ${response.data.status}`);
    console.log(`📦 Found ${response.data.total} DevOps jobs`);
    console.log(`🔍 Search terms used: ${response.data.search_terms.join(', ')}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nSample jobs:');
      response.data.data.slice(0, 3).forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.company} (${job.location})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Scrape jobs for "ML Engineer" specialization with user ID
  console.log('\n📋 Test 2: Scrape ML Engineer Jobs (With User ID)');
  console.log('-'.repeat(80));
  try {
    // Replace with actual user ID from your database
    const testUserId = 'd6ed400c-94d3-4e5e-b180-1530c1ba707f';
    
    const response = await axios.get(`${API_URL}/jobs/specialization/ML Engineer`, {
      params: { userId: testUserId },
      timeout: 60000
    });
    
    console.log(`✅ Status: ${response.data.status}`);
    console.log(`📦 Found ${response.data.total} ML Engineer jobs`);
    console.log(`🔍 Search terms used: ${response.data.search_terms.join(', ')}`);
    console.log(`📍 Location filter: ${response.data.location || 'None'}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nSample jobs:');
      response.data.data.slice(0, 3).forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.company} (${job.location})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test 3: Scrape jobs for "Data Scientist" specialization
  console.log('\n📋 Test 3: Scrape Data Scientist Jobs');
  console.log('-'.repeat(80));
  try {
    const response = await axios.get(`${API_URL}/jobs/specialization/Data Scientist`, {
      timeout: 60000
    });
    
    console.log(`✅ Status: ${response.data.status}`);
    console.log(`📦 Found ${response.data.total} Data Scientist jobs`);
    console.log(`🔍 Search terms used: ${response.data.search_terms.join(', ')}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nSample jobs:');
      response.data.data.slice(0, 3).forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.company} (${job.location})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  // Test 4: Verify jobs are stored in database
  console.log('\n📋 Test 4: Verify Jobs Stored in Database');
  console.log('-'.repeat(80));
  try {
    const response = await axios.get(`${API_URL}/jobs`, {
      params: { limit: 5 }
    });
    
    console.log(`✅ Database has ${response.data.data?.length || 0} jobs (showing 5)`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nRecent jobs in database:');
      response.data.data.forEach((job, idx) => {
        console.log(`  ${idx + 1}. ${job.title} - ${job.company} (Source: ${job.source})`);
      });
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Specialization scraping tests completed!');
  console.log('\n💡 Frontend Flow:');
  console.log('1. User clicks specialization (e.g., "DevOps")');
  console.log('2. Frontend calls: GET /api/v1/jobs/specialization/DevOps?userId=xxx');
  console.log('3. Backend scrapes jobs from Shine.com');
  console.log('4. Backend stores jobs in database');
  console.log('5. Frontend displays scraped jobs');
}

testSpecializationScraping().catch(console.error);
