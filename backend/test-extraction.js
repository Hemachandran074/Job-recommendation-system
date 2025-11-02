/**
 * Test script for LLM extraction endpoint
 * Tests both extraction and persistence of fields
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:4000/api/v1';

async function testExtraction() {
  console.log('🧪 Testing LLM Extraction Endpoint\n');

  // Test job with rich description
  const testJob = {
    id: 'test-123',
    title: 'Senior Backend Engineer',
    company_name: 'Tech Corp',
    description: `We are looking for a Senior Backend Engineer with 5-8 years of experience.
    
Skills Required:
- Node.js, Python, Java
- AWS, Docker, Kubernetes
- SQL, MongoDB

Salary: 15-20 LPA
Location: Bangalore
Type: Full-time

The ideal candidate will have strong problem-solving skills and be passionate about building scalable systems.`,
    location: 'Bangalore',
    job_type: 'Full-time'
  };

  try {
    console.log('📤 Sending extraction request...');
    console.log('Job title:', testJob.title);
    console.log('Job ID:', testJob.id);
    console.log('\n');

    const response = await axios.post(`${BACKEND_URL}/jobs/extract`, {
      job: testJob
    }, {
      timeout: 60000 // 60 seconds
    });

    console.log('✅ Extraction Response:');
    console.log('Status:', response.data.status);
    
    if (response.data.data) {
      const extracted = response.data.data;
      
      console.log('\n📊 Extracted Fields:');
      console.log('─────────────────────────────────────');
      
      console.log('\n📝 Description:');
      console.log(extracted.description || 'Not extracted');
      
      console.log('\n🎯 Skills:');
      console.log((extracted.skills || []).join(', ') || 'Not extracted');
      
      console.log('\n💰 Salary:');
      if (extracted.salary) {
        console.log(`  Min: ${extracted.salary.min} ${extracted.salary.currency || ''}`);
        console.log(`  Max: ${extracted.salary.max} ${extracted.salary.currency || ''}`);
        console.log(`  Unit: ${extracted.salary.unit || 'N/A'}`);
      } else {
        console.log('  Not extracted');
      }
      
      console.log('\n📅 Experience:');
      if (extracted.experience) {
        console.log(`  Min: ${extracted.experience.min_months} months`);
        console.log(`  Max: ${extracted.experience.max_months} months`);
      } else {
        console.log('  Not extracted');
      }
      
      console.log('\n⏱️  Period:');
      if (extracted.period) {
        console.log(`  ${extracted.period.months} months`);
      } else {
        console.log('  Not extracted');
      }
      
      // Check if persistence happened
      if (extracted._persisted && extracted._persisted.job) {
        console.log('\n✅ PERSISTENCE SUCCESS');
        console.log('─────────────────────────────────────');
        const persisted = extracted._persisted.job;
        console.log('Persisted Job ID:', persisted.id);
        console.log('Persisted Experience:', persisted.experience || 'Not saved');
        console.log('Persisted Salary Min:', persisted.salary_min || 'Not saved');
        console.log('Persisted Salary Max:', persisted.salary_max || 'Not saved');
        console.log('Persisted Skills:', (persisted.skills || []).join(', ') || 'Not saved');
      } else {
        console.log('\n⚠️  No persistence data in response');
        console.log('This is normal if job ID was not found in database');
      }
      
      if (response.data.fallback) {
        console.log('\n⚠️  Used fallback heuristic extraction (GROQ API was unreachable)');
      }
    }

    console.log('\n✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run test
console.log('Starting extraction test...');
console.log('Make sure backend is running on port 4000\n');

testExtraction().catch(console.error);
