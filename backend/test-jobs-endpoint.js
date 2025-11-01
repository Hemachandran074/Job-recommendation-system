const axios = require('axios');

async function testJobsEndpoint() {
  try {
    console.log('🔍 Testing /active-jb-7d endpoint with search parameters...\n');
    
    const baseURL = 'https://internships-api.p.rapidapi.com/active-jb-7d';
    const headers = {
      'x-rapidapi-host': 'internships-api.p.rapidapi.com',
      'x-rapidapi-key': 'c246b9916fmshbbbab4018832840p164a8fjsn8e91b894d8fc'
    };
    
    // Test 1: Search for Python jobs
    console.log('📌 Test 1: Searching for "Python" jobs...');
    const response1 = await axios.get(baseURL, { 
      params: { title_filter: 'Python', offset: 0 },
      headers 
    });
    console.log(`✅ Found ${response1.data.length} Python jobs`);
    if (response1.data.length > 0) {
      console.log(`   Sample: "${response1.data[0].title}" at ${response1.data[0].organization || response1.data[0].company}`);
    }
    
    // Test 2: Search for software engineer jobs
    console.log('\n📌 Test 2: Searching for "software engineer" jobs...');
    const response2 = await axios.get(baseURL, {
      params: { title_filter: 'software engineer', offset: 0 },
      headers
    });
    console.log(`✅ Found ${response2.data.length} software engineer jobs`);
    if (response2.data.length > 0) {
      console.log(`   Sample: "${response2.data[0].title}" at ${response2.data[0].organization || response2.data[0].company}`);
    }
    
    // Test 3: Search with location filter
    console.log('\n📌 Test 3: Searching for "developer" jobs in "India"...');
    const response3 = await axios.get(baseURL, {
      params: { 
        title_filter: 'developer',
        location_filter: 'India',
        offset: 0 
      },
      headers
    });
    console.log(`✅ Found ${response3.data.length} developer jobs in India`);
    if (response3.data.length > 0) {
      console.log(`   Sample: "${response3.data[0].title}" at ${response3.data[0].organization || response3.data[0].company}`);
      console.log(`   Location: ${response3.data[0].locations_derived?.[0] || 'N/A'}`);
    }
    
    // Test 4: Remote jobs filter
    console.log('\n📌 Test 4: Searching for remote "engineer" jobs...');
    const response4 = await axios.get(baseURL, {
      params: { 
        title_filter: 'engineer',
        remote: 'true',
        offset: 0 
      },
      headers
    });
    console.log(`✅ Found ${response4.data.length} remote engineer jobs`);
    if (response4.data.length > 0) {
      console.log(`   Sample: "${response4.data[0].title}" at ${response4.data[0].organization || response4.data[0].company}`);
      console.log(`   Remote: ${response4.data[0].remote_derived}`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('📛 Status:', error.response.status);
      console.error('📛 Status Text:', error.response.statusText);
      console.error('📛 Data:', error.response.data);
    }
  }
}

testJobsEndpoint();
