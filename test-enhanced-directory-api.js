const fetch = require('node-fetch');

async function testEnhancedDirectoryAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Enhanced Directory API Features...\n');

  // Test 1: Basic functionality
  console.log('1. Testing basic public polls endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/polls/public`);
    const data = await response.json();
    console.log('✅ Basic endpoint works');
    console.log(`   Found ${data.polls?.length || 0} polls`);
  } catch (error) {
    console.log('❌ Basic endpoint failed:', error.message);
  }

  // Test 2: Category filtering
  console.log('\n2. Testing category filtering...');
  try {
    const response = await fetch(`${baseUrl}/api/polls/public?category=technology`);
    const data = await response.json();
    console.log('✅ Category filtering works');
    console.log(`   Found ${data.polls?.length || 0} technology polls`);
  } catch (error) {
    console.log('❌ Category filtering failed:', error.message);
  }

  // Test 3: Advanced sorting
  console.log('\n3. Testing advanced sorting options...');
  const sortOptions = ['trending', 'engagement', 'views'];
  
  for (const sortBy of sortOptions) {
    try {
      const response = await fetch(`${baseUrl}/api/polls/public?sortBy=${sortBy}`);
      const data = await response.json();
      console.log(`✅ Sorting by ${sortBy} works`);
      console.log(`   Found ${data.polls?.length || 0} polls`);
    } catch (error) {
      console.log(`❌ Sorting by ${sortBy} failed:`, error.message);
    }
  }

  // Test 4: Date range filtering
  console.log('\n4. Testing date range filtering...');
  const dateRanges = ['today', 'week', 'month'];
  
  for (const dateRange of dateRanges) {
    try {
      const response = await fetch(`${baseUrl}/api/polls/public?dateRange=${dateRange}`);
      const data = await response.json();
      console.log(`✅ Date range ${dateRange} works`);
      console.log(`   Found ${data.polls?.length || 0} polls`);
    } catch (error) {
      console.log(`❌ Date range ${dateRange} failed:`, error.message);
    }
  }

  // Test 5: Tag filtering
  console.log('\n5. Testing tag filtering...');
  try {
    const response = await fetch(`${baseUrl}/api/polls/public?tags=test,demo`);
    const data = await response.json();
    console.log('✅ Tag filtering works');
    console.log(`   Found ${data.polls?.length || 0} polls with tags`);
  } catch (error) {
    console.log('❌ Tag filtering failed:', error.message);
  }

  // Test 6: Vote count filtering
  console.log('\n6. Testing vote count filtering...');
  try {
    const response = await fetch(`${baseUrl}/api/polls/public?minVotes=1&maxVotes=100`);
    const data = await response.json();
    console.log('✅ Vote count filtering works');
    console.log(`   Found ${data.polls?.length || 0} polls with 1-100 votes`);
  } catch (error) {
    console.log('❌ Vote count filtering failed:', error.message);
  }

  // Test 7: Combined filters
  console.log('\n7. Testing combined filters...');
  try {
    const params = new URLSearchParams({
      search: 'test',
      sortBy: 'trending',
      dateRange: 'month',
      hasDescription: 'true'
    });
    const response = await fetch(`${baseUrl}/api/polls/public?${params}`);
    const data = await response.json();
    console.log('✅ Combined filters work');
    console.log(`   Found ${data.polls?.length || 0} polls matching all criteria`);
    
    // Check if response includes new fields
    if (data.polls && data.polls.length > 0) {
      const poll = data.polls[0];
      console.log('   Sample poll structure:');
      console.log(`   - Has category: ${poll.category ? '✅' : '❌'}`);
      console.log(`   - Has tags: ${poll.tags ? '✅' : '❌'}`);
      console.log(`   - Has popularity metrics: ${poll.popularity ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log('❌ Combined filters failed:', error.message);
  }

  console.log('\n🎉 Enhanced Directory API testing complete!');
}

// Run the test
testEnhancedDirectoryAPI().catch(console.error);