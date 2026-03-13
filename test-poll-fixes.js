// Test script to verify poll creation and viewing fixes
const BASE_URL = 'http://localhost:3000'

async function testPollCreationAndViewing() {
  console.log('🧪 Testing Poll Creation and Viewing Fixes...\n')

  try {
    // Test 1: Create a poll with string privacy (new format)
    console.log('1️⃣ Testing poll creation with string privacy...')
    const createResponse = await fetch(`${BASE_URL}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real app, this would include authentication headers
      },
      body: JSON.stringify({
        title: 'Test Poll - String Privacy',
        description: 'Testing the fixed privacy field format',
        type: 'single',
        options: [
          { text: 'Option 1' },
          { text: 'Option 2' }
        ],
        privacy: 'public', // String format (new)
        settings: {
          allowAnonymous: true,
          requireCaptcha: false
        }
      })
    })

    if (createResponse.status === 401) {
      console.log('❌ Authentication required - this is expected without login')
      console.log('✅ API is properly protected with authentication\n')
    } else {
      const createData = await createResponse.json()
      console.log('Response:', createData)
      
      if (createResponse.ok) {
        console.log('✅ Poll created successfully with string privacy!')
        
        // Test 2: Try to view the created poll
        console.log('\n2️⃣ Testing poll viewing...')
        const pollId = createData.poll.id
        const viewResponse = await fetch(`${BASE_URL}/api/polls/${pollId}`)
        
        if (viewResponse.ok) {
          const pollData = await viewResponse.json()
          console.log('✅ Poll retrieved successfully!')
          console.log('Poll data:', JSON.stringify(pollData, null, 2))
        } else {
          console.log('❌ Failed to retrieve poll:', await viewResponse.text())
        }
      } else {
        console.log('❌ Poll creation failed:', createData)
      }
    }

    // Test 3: Test with object privacy (legacy format) - should still work
    console.log('\n3️⃣ Testing poll creation with object privacy (legacy)...')
    const legacyResponse = await fetch(`${BASE_URL}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Poll - Object Privacy',
        description: 'Testing backward compatibility with object privacy',
        type: 'yesno',
        options: [
          { text: 'Yes' },
          { text: 'No' }
        ],
        privacy: { // Object format (legacy)
          isPublic: true,
          allowAnonymous: true,
          requireEmailVerification: false,
          restrictedDomains: []
        },
        settings: {
          allowAnonymous: true
        }
      })
    })

    if (legacyResponse.status === 401) {
      console.log('❌ Authentication required - this is expected without login')
      console.log('✅ Legacy format test blocked by auth (which is correct)\n')
    } else {
      const legacyData = await legacyResponse.json()
      if (legacyResponse.ok) {
        console.log('✅ Legacy object privacy format still works!')
      } else {
        console.log('❌ Legacy format failed:', legacyData)
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run the test
testPollCreationAndViewing()