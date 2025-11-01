const axios = require('axios');

async function testRapidAPI() {
  try {
    console.log('🔍 Testing RapidAPI endpoints...\n');
    
    const headers = {
      'x-rapidapi-host': 'internships-api.p.rapidapi.com',
      'x-rapidapi-key': 'c246b9916fmshbbbab4018832840p164a8fjsn8e91b894d8fc'
    };
    
    // Test 1: Fetch jobs from /active-jb-7d
    console.log('📌 Test 1: Fetching jobs from /active-jb-7d...');
    const jobsResponse = await axios.get('https://internships-api.p.rapidapi.com/active-jb-7d', { headers });
    console.log(`✅ Found ${jobsResponse.data.length} jobs`);
    if (jobsResponse.data.length > 0) {
      console.log(`   Sample: "${jobsResponse.data[0].title}" at ${jobsResponse.data[0].organization}`);
    }
    
    // Test 2: Fetch internships from /active-ats-7d
    console.log('\n📌 Test 2: Fetching internships from /active-ats-7d...');
    const internshipsResponse = await axios.get('https://internships-api.p.rapidapi.com/active-ats-7d', { headers });
    console.log(`✅ Found ${internshipsResponse.data.length} internships`);
    if (internshipsResponse.data.length > 0) {
      console.log(`   Sample: "${internshipsResponse.data[0].title}" at ${internshipsResponse.data[0].organization}`);
    }
    
    // Test 3: Client-side filtering
    console.log('\n📌 Test 3: Client-side filtering for "Python" jobs...');
    const allListings = [...jobsResponse.data, ...internshipsResponse.data];
    const pythonJobs = allListings.filter(item => {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      return title.includes('python') || description.includes('python');
    });
    console.log(`✅ Found ${pythonJobs.length} Python-related listings`);
    if (pythonJobs.length > 0) {
      console.log(`   Examples:`);
      pythonJobs.slice(0, 3).forEach(job => {
        console.log(`   - "${job.title}" at ${job.organization}`);
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log(`📊 Total listings available: ${allListings.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📛 Status:', error.response.status);
      console.error('📛 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRapidAPI();
