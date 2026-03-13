// Simple test script to verify the directory API functionality
// Run with: node test-directory-api.js

const testDirectoryAPI = async () => {
  console.log('Testing Directory API...\n')

  // Test cases
  const testCases = [
    {
      name: 'Basic public polls fetch',
      url: 'http://localhost:3000/api/polls/public'
    },
    {
      name: 'Search functionality',
      url: 'http://localhost:3000/api/polls/public?search=test'
    },
    {
      name: 'Type filtering',
      url: 'http://localhost:3000/api/polls/public?type=single'
    },
    {
      name: 'Popularity sorting',
      url: 'http://localhost:3000/api/polls/public?sortBy=popular'
    },
    {
      name: 'Trending sorting',
      url: 'http://localhost:3000/api/polls/public?sortBy=trending'
    },
    {
      name: 'Pagination',
      url: 'http://localhost:3000/api/polls/public?page=1&limit=5'
    },
    {
      name: 'Combined filters',
      url: 'http://localhost:3000/api/polls/public?search=poll&type=single&sortBy=newest&page=1&limit=10'
    }
  ]

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`)
      console.log(`URL: ${testCase.url}`)
      
      const response = await fetch(testCase.url)
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('✅ Success')
        console.log(`   - Status: ${response.status}`)
        console.log(`   - Polls returned: ${data.polls?.length || 0}`)
        console.log(`   - Total count: ${data.pagination?.totalCount || 0}`)
        console.log(`   - Current page: ${data.pagination?.currentPage || 1}`)
        console.log(`   - Filters applied: ${JSON.stringify(data.filters)}`)
        
        // Check if popularity metrics are included
        if (data.polls?.length > 0) {
          const firstPoll = data.polls[0]
          if (firstPoll.popularity) {
            console.log(`   - Sample popularity metrics:`)
            console.log(`     * Total votes: ${firstPoll.popularity.totalVotes}`)
            console.log(`     * Unique voters: ${firstPoll.popularity.uniqueVoters}`)
            console.log(`     * Trending score: ${firstPoll.popularity.trendingScore}`)
            console.log(`     * Engagement rate: ${firstPoll.popularity.engagementRate}%`)
          }
        }
      } else {
        console.log('❌ Failed')
        console.log(`   - Status: ${response.status}`)
        console.log(`   - Error: ${data.error || 'Unknown error'}`)
      }
      
      console.log('')
    } catch (error) {
      console.log('❌ Network Error')
      console.log(`   - ${error.message}`)
      console.log('')
    }
  }

  console.log('Testing complete!')
}

// Check if we're running this script directly
if (require.main === module) {
  console.log('Directory API Test Script')
  console.log('Make sure the development server is running on http://localhost:3000')
  console.log('Run: npm run dev\n')
  
  testDirectoryAPI().catch(console.error)
}

module.exports = { testDirectoryAPI }