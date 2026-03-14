// Test script for directory filtering and sorting functionality
const BASE_URL = 'http://localhost:3000'

async function testDirectoryFilters() {
  console.log('🧪 Testing Directory Filtering and Sorting...\n')

  const tests = [
    {
      name: 'Basic public polls fetch',
      url: '/api/polls/public'
    },
    {
      name: 'Search functionality',
      url: '/api/polls/public?search=test'
    },
    {
      name: 'Category filtering',
      url: '/api/polls/public?category=technology'
    },
    {
      name: 'Poll type filtering',
      url: '/api/polls/public?type=single'
    },
    {
      name: 'Date range filtering',
      url: '/api/polls/public?dateRange=week'
    },
    {
      name: 'Popularity sorting',
      url: '/api/polls/public?sortBy=popular'
    },
    {
      name: 'Trending sorting',
      url: '/api/polls/public?sortBy=trending'
    },
    {
      name: 'Engagement sorting',
      url: '/api/polls/public?sortBy=engagement'
    },
    {
      name: 'Minimum votes filtering',
      url: '/api/polls/public?minVotes=5'
    },
    {
      name: 'Combined filters',
      url: '/api/polls/public?category=technology&sortBy=popular&minVotes=1'
    }
  ]

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`)
      const response = await fetch(`${BASE_URL}${test.url}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log(`✅ ${test.name}: Success`)
        console.log(`   - Found ${data.polls?.length || 0} polls`)
        console.log(`   - Total count: ${data.pagination?.totalCount || 0}`)
        console.log(`   - Applied filters:`, JSON.stringify(data.filters || {}, null, 2))
        
        // Test specific functionality
        if (test.url.includes('sortBy=popular') && data.polls?.length > 1) {
          const votes = data.polls.map(p => p.metadata.totalVotes)
          const isSorted = votes.every((val, i, arr) => i === 0 || arr[i-1] >= val)
          console.log(`   - Popularity sorting: ${isSorted ? '✅ Correct' : '❌ Incorrect'}`)
        }
        
        if (test.url.includes('category=technology') && data.polls?.length > 0) {
          const allTech = data.polls.every(p => p.category === 'technology' || !p.category)
          console.log(`   - Category filtering: ${allTech ? '✅ Correct' : '❌ Some non-tech polls found'}`)
        }
        
        if (test.url.includes('minVotes=5') && data.polls?.length > 0) {
          const allAboveMin = data.polls.every(p => p.metadata.totalVotes >= 5)
          console.log(`   - Min votes filtering: ${allAboveMin ? '✅ Correct' : '❌ Some polls below minimum'}`)
        }
        
      } else {
        console.log(`❌ ${test.name}: Failed`)
        console.log(`   - Status: ${response.status}`)
        console.log(`   - Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error`)
      console.log(`   - ${error.message}`)
    }
    console.log('')
  }

  console.log('🏁 Directory filtering tests completed!')
}

// Run the tests
testDirectoryFilters().catch(console.error)