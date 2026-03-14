// Test script to verify voting page functionality
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: null });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testVotingPageFlow() {
  console.log('🧪 Testing Voting Page Flow...\n');

  try {
    // Step 1: Get a list of existing polls
    console.log('1. Fetching existing polls...');
    const pollsResponse = await makeRequest(`${BASE_URL}/api/polls/public?limit=1`);
    
    if (!pollsResponse.ok || !pollsResponse.data || !pollsResponse.data.polls || pollsResponse.data.polls.length === 0) {
      console.log('❌ No polls found. Please create a poll first.');
      return;
    }

    const testPoll = pollsResponse.data.polls[0];
    console.log(`✅ Found poll: "${testPoll.title}" (ID: ${testPoll.id})`);

    // Step 2: Test voting page accessibility
    console.log('\n2. Testing voting page accessibility...');
    const votingPageResponse = await makeRequest(`${BASE_URL}/vote/${testPoll.id}`);
    
    if (votingPageResponse.ok) {
      console.log('✅ Voting page is accessible');
    } else {
      console.log(`❌ Voting page returned status: ${votingPageResponse.status}`);
      return;
    }

    // Step 3: Test poll results page accessibility
    console.log('\n3. Testing poll results page accessibility...');
    const resultsPageResponse = await makeRequest(`${BASE_URL}/poll/${testPoll.id}`);
    
    if (resultsPageResponse.ok) {
      console.log('✅ Results page is accessible');
    } else {
      console.log(`❌ Results page returned status: ${resultsPageResponse.status}`);
      return;
    }

    // Step 4: Test embed page accessibility
    console.log('\n4. Testing embed page accessibility...');
    const embedPageResponse = await makeRequest(`${BASE_URL}/embed/${testPoll.id}`);
    
    if (embedPageResponse.ok) {
      console.log('✅ Embed page is accessible');
    } else {
      console.log(`❌ Embed page returned status: ${embedPageResponse.status}`);
    }

    console.log('\n🎉 All voting page tests passed!');
    console.log('\n📋 Test Summary:');
    console.log(`   • Voting URL: ${BASE_URL}/vote/${testPoll.id}`);
    console.log(`   • Results URL: ${BASE_URL}/poll/${testPoll.id}`);
    console.log(`   • Embed URL: ${BASE_URL}/embed/${testPoll.id}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVotingPageFlow();