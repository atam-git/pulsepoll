/**
 * Integration Tests for Complete PulsePoll Workflows
 * Tests end-to-end functionality across the entire platform
 */

import { NextRequest } from 'next/server'
import { POST as RegisterPOST } from '@/app/api/auth/register/route'
import { POST as PollPOST } from '@/app/api/polls/route'
import { POST as VotePOST } from '@/app/api/polls/[id]/vote/route'
import { GET as AnalyticsGET } from '@/app/api/polls/[id]/analytics/route'
import { GET as PublicGET } from '@/app/api/polls/public/route'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'

// Mock database connection
jest.mock('@/lib/mongodb')
jest.mock('@/models/User')
jest.mock('@/models/Poll')
jest.mock('@/models/Vote')

describe('Complete Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-End Poll Creation and Voting Flow', () => {
    it('should complete full poll lifecycle: create → vote → analyze', async () => {
      // Mock user registration
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue(true)
      }
      ;(User.findOne as jest.Mock).mockResolvedValue(null)
      ;(User.prototype.save as jest.Mock).mockResolvedValue(mockUser)

      // Step 1: Register user
      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
      })

      const registerResponse = await RegisterPOST(registerRequest)
      expect(registerResponse.status).toBe(201)

      // Step 2: Create poll
      const mockPoll = {
        _id: 'poll123',
        title: 'Test Poll',
        type: 'single',
        options: [
          { id: 'opt1', text: 'Option 1', voteCount: 0 },
          { id: 'opt2', text: 'Option 2', voteCount: 0 }
        ],
        creatorId: 'user123',
        privacy: 'public',
        status: 'active',
        metadata: { totalVotes: 0, uniqueVoters: 0, viewCount: 0 },
        save: jest.fn().mockResolvedValue(true)
      }
      ;(Poll.prototype.save as jest.Mock).mockResolvedValue(mockPoll)

      const pollRequest = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          title: 'Test Poll',
          type: 'single',
          options: [
            { text: 'Option 1' },
            { text: 'Option 2' }
          ],
          privacy: 'public'
        })
      })

      // Mock authentication
      Object.defineProperty(pollRequest, 'user', {
        value: { id: 'user123', role: 'user' },
        writable: true
      })

      const pollResponse = await PollPOST(pollRequest)
      expect(pollResponse.status).toBe(201)

      // Step 3: Submit votes
      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
      ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})
      ;(Poll.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockPoll)

      const voteRequest = new NextRequest('http://localhost:3000/api/polls/poll123/vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1'
        },
        body: JSON.stringify({
          selectedOptions: ['opt1']
        })
      })

      const voteResponse = await VotePOST(voteRequest, { params: { id: 'poll123' } })
      expect(voteResponse.status).toBe(200)

      // Step 4: Check analytics
      const updatedPoll = {
        ...mockPoll,
        options: [
          { id: 'opt1', text: 'Option 1', voteCount: 1 },
          { id: 'opt2', text: 'Option 2', voteCount: 0 }
        ],
        metadata: { totalVotes: 1, uniqueVoters: 1, viewCount: 1 }
      }
      ;(Poll.findById as jest.Mock).mockResolvedValue(updatedPoll)

      const analyticsRequest = new NextRequest('http://localhost:3000/api/polls/poll123/analytics')
      const analyticsResponse = await AnalyticsGET(analyticsRequest, { params: { id: 'poll123' } })
      const analyticsData = await analyticsResponse.json()

      expect(analyticsResponse.status).toBe(200)
      expect(analyticsData.success).toBe(true)
      expect(analyticsData.analytics.totalVotes).toBe(1)
    })

    it('should handle authentication flow correctly', async () => {
      // Test authenticated vs anonymous access
      const mockPoll = {
        _id: 'poll123',
        title: 'Test Poll',
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [{ id: 'opt1', text: 'Option 1', voteCount: 0 }],
        metadata: { totalVotes: 0, uniqueVoters: 0 }
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
      ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})

      // Anonymous vote should work
      const anonymousVoteRequest = new NextRequest('http://localhost:3000/api/polls/poll123/vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1'
        },
        body: JSON.stringify({
          selectedOptions: ['opt1']
        })
      })

      const anonymousResponse = await VotePOST(anonymousVoteRequest, { params: { id: 'poll123' } })
      expect(anonymousResponse.status).toBe(200)

      // Authenticated vote should also work
      const authenticatedVoteRequest = new NextRequest('http://localhost:3000/api/polls/poll123/vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.2'
        },
        body: JSON.stringify({
          selectedOptions: ['opt1']
        })
      })

      Object.defineProperty(authenticatedVoteRequest, 'user', {
        value: { id: 'user123', role: 'user' },
        writable: true
      })

      const authenticatedResponse = await VotePOST(authenticatedVoteRequest, { params: { id: 'poll123' } })
      expect(authenticatedResponse.status).toBe(200)
    })
  })

  describe('Real-time Updates Integration', () => {
    it('should verify real-time update flow components exist', async () => {
      // Test that real-time components are properly integrated
      // This is a structural test since we can't easily test SSE in unit tests
      
      const mockPoll = {
        _id: 'poll123',
        title: 'Test Poll',
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [{ id: 'opt1', text: 'Option 1', voteCount: 1 }],
        metadata: { totalVotes: 1, uniqueVoters: 1 }
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)

      // Verify analytics endpoint works (used by real-time updates)
      const analyticsRequest = new NextRequest('http://localhost:3000/api/polls/poll123/analytics')
      const analyticsResponse = await AnalyticsGET(analyticsRequest, { params: { id: 'poll123' } })
      
      expect(analyticsResponse.status).toBe(200)
      
      const data = await analyticsResponse.json()
      expect(data.success).toBe(true)
      expect(data.analytics).toBeDefined()
      expect(data.chartData).toBeDefined()
    })
  })

  describe('Public Directory Integration', () => {
    it('should integrate public poll discovery with voting', async () => {
      const mockPolls = [
        {
          _id: 'poll1',
          title: 'Public Poll 1',
          type: 'single',
          privacy: 'public',
          status: 'active',
          options: [{ id: 'opt1', text: 'Option 1', voteCount: 5 }],
          metadata: { totalVotes: 5, uniqueVoters: 5, viewCount: 10 },
          createdAt: new Date(),
          updatedAt: new Date(),
          creatorId: 'user123'
        }
      ]

      ;(Poll.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPolls)
              })
            })
          })
        })
      })
      ;(Poll.countDocuments as jest.Mock).mockResolvedValue(1)

      // Test public directory listing
      const publicRequest = new NextRequest('http://localhost:3000/api/polls/public?sortBy=popular')
      const publicResponse = await PublicGET(publicRequest)
      const publicData = await publicResponse.json()

      expect(publicResponse.status).toBe(200)
      expect(publicData.success).toBe(true)
      expect(publicData.polls).toHaveLength(1)
      expect(publicData.polls[0].title).toBe('Public Poll 1')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle cascading errors gracefully', async () => {
      // Test database connection failure
      ;(Poll.findById as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const voteRequest = new NextRequest('http://localhost:3000/api/polls/invalid-id/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedOptions: ['opt1']
        })
      })

      const voteResponse = await VotePOST(voteRequest, { params: { id: 'invalid-id' } })
      expect(voteResponse.status).toBe(500)

      const errorData = await voteResponse.json()
      expect(errorData.success).toBe(false)
      expect(errorData.error).toBeDefined()
    })

    it('should validate input across all endpoints', async () => {
      // Test invalid poll creation
      const invalidPollRequest = new NextRequest('http://localhost:3000/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '', // Invalid: empty title
          type: 'invalid-type', // Invalid: unknown type
          options: [] // Invalid: no options
        })
      })

      Object.defineProperty(invalidPollRequest, 'user', {
        value: { id: 'user123', role: 'user' },
        writable: true
      })

      const pollResponse = await PollPOST(invalidPollRequest)
      expect(pollResponse.status).toBe(400)

      const errorData = await pollResponse.json()
      expect(errorData.success).toBe(false)
      expect(errorData.errors).toBeDefined()
    })
  })

  describe('Performance Integration', () => {
    it('should handle multiple concurrent operations', async () => {
      const mockPoll = {
        _id: 'poll123',
        title: 'Concurrent Test Poll',
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [{ id: 'opt1', text: 'Option 1', voteCount: 0 }],
        metadata: { totalVotes: 0, uniqueVoters: 0 }
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
      ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})
      ;(Poll.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockPoll)

      // Simulate concurrent votes
      const votePromises = Array.from({ length: 5 }, (_, i) => {
        const voteRequest = new NextRequest('http://localhost:3000/api/polls/poll123/vote', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': `192.168.1.${i + 1}`
          },
          body: JSON.stringify({
            selectedOptions: ['opt1']
          })
        })

        return VotePOST(voteRequest, { params: { id: 'poll123' } })
      })

      const responses = await Promise.all(votePromises)
      
      // All votes should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})