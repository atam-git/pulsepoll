/**
 * Performance and Load Testing for PulsePoll Platform
 * Tests concurrent user handling, vote processing performance, and real-time update scalability
 */

import { NextRequest } from 'next/server'
import { POST as VotePOST } from '@/app/api/polls/[id]/vote/route'
import { GET as PublicGET } from '@/app/api/polls/public/route'
import { GET as AnalyticsGET } from '@/app/api/polls/[id]/analytics/route'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'

// Mock database connection
jest.mock('@/lib/mongodb')
jest.mock('@/models/Poll')
jest.mock('@/models/Vote')

describe('Performance and Load Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Concurrent User Handling', () => {
    it('should handle 100 concurrent votes efficiently', async () => {
      const mockPoll = {
        _id: 'poll123',
        title: 'Load Test Poll',
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [
          { id: 'opt1', text: 'Option 1', voteCount: 0 },
          { id: 'opt2', text: 'Option 2', voteCount: 0 }
        ],
        metadata: { totalVotes: 0, uniqueVoters: 0 }
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
      ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})
      ;(Poll.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockPoll)

      const startTime = Date.now()
      
      // Create 100 concurrent vote requests
      const votePromises = Array.from({ length: 100 }, (_, i) => {
        const voteRequest = new NextRequest('http://localhost:3000/api/polls/poll123/vote', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': `192.168.1.${(i % 255) + 1}`,
            'User-Agent': `TestAgent-${i}`
          },
          body: JSON.stringify({
            selectedOptions: [i % 2 === 0 ? 'opt1' : 'opt2']
          })
        })

        return VotePOST(voteRequest, { params: { id: 'poll123' } })
      })

      const responses = await Promise.all(votePromises)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Performance assertions
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      
      // All votes should succeed
      const successfulVotes = responses.filter(response => response.status === 200)
      expect(successfulVotes.length).toBeGreaterThan(90) // At least 90% success rate

      console.log(`100 concurrent votes completed in ${duration}ms`)
      console.log(`Success rate: ${(successfulVotes.length / responses.length * 100).toFixed(1)}%`)
    }, 10000) // 10 second timeout

    it('should handle concurrent analytics requests efficiently', async () => {
      const mockPoll = {
        _id: 'poll123',
        title: 'Analytics Load Test',
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [
          { id: 'opt1', text: 'Option 1', voteCount: 50 },
          { id: 'opt2', text: 'Option 2', voteCount: 30 }
        ],
        metadata: { totalVotes: 80, uniqueVoters: 75, viewCount: 200 },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)

      const startTime = Date.now()

      // Create 50 concurrent analytics requests
      const analyticsPromises = Array.from({ length: 50 }, () => {
        const analyticsRequest = new NextRequest('http://localhost:3000/api/polls/poll123/analytics')
        return AnalyticsGET(analyticsRequest, { params: { id: 'poll123' } })
      })

      const responses = await Promise.all(analyticsPromises)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Performance assertions
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      console.log(`50 concurrent analytics requests completed in ${duration}ms`)
    }, 10000)
  })

  describe('Vote Processing Performance', () => {
    it('should process votes with consistent response times', async () => {
      const mockPoll = {
        _id: 'poll123',
        title: 'Performance Test Poll',
        type: 'multiple',
        privacy: 'public',
        status: 'active',
        options: [
          { id: 'opt1', text: 'Option 1', voteCount: 0 },
          { id: 'opt2', text: 'Option 2', voteCount: 0 },
          { id: 'opt3', text: 'Option 3', voteCount: 0 }
        ],
        metadata: { totalVotes: 0, uniqueVoters: 0 }
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
      ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})
      ;(Poll.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockPoll)

      const responseTimes: number[] = []

      // Test 20 sequential votes to measure consistency
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now()
        
        const voteRequest = new NextRequest('http://localhost:3000/api/polls/poll123/vote', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': `192.168.2.${i + 1}`
          },
          body: JSON.stringify({
            selectedOptions: ['opt1', 'opt2']
          })
        })

        const response = await VotePOST(voteRequest, { params: { id: 'poll123' } })
        const endTime = Date.now()
        
        expect(response.status).toBe(200)
        responseTimes.push(endTime - startTime)
      }

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)

      // Performance assertions
      expect(avgResponseTime).toBeLessThan(500) // Average under 500ms
      expect(maxResponseTime).toBeLessThan(1000) // Max under 1 second
      
      console.log(`Vote processing performance:`)
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`)
      console.log(`  Min: ${minResponseTime}ms`)
      console.log(`  Max: ${maxResponseTime}ms`)
    })

    it('should handle different poll types efficiently', async () => {
      const pollTypes = ['single', 'multiple', 'ranking', 'yesno', 'survey']
      const performanceResults: { [key: string]: number } = {}

      for (const pollType of pollTypes) {
        const mockPoll = {
          _id: `poll-${pollType}`,
          title: `${pollType} Poll`,
          type: pollType,
          privacy: 'public',
          status: 'active',
          options: [
            { id: 'opt1', text: 'Option 1', voteCount: 0 },
            { id: 'opt2', text: 'Option 2', voteCount: 0 }
          ],
          metadata: { totalVotes: 0, uniqueVoters: 0 }
        }

        ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
        ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
        ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})

        const startTime = Date.now()

        let voteData: any = { selectedOptions: ['opt1'] }
        
        // Customize vote data based on poll type
        if (pollType === 'multiple') {
          voteData.selectedOptions = ['opt1', 'opt2']
        } else if (pollType === 'ranking') {
          voteData.rankings = { opt1: 1, opt2: 2 }
        } else if (pollType === 'survey') {
          voteData.textResponses = { opt1: 'Test response' }
        }

        const voteRequest = new NextRequest(`http://localhost:3000/api/polls/poll-${pollType}/vote`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': '192.168.3.1'
          },
          body: JSON.stringify(voteData)
        })

        const response = await VotePOST(voteRequest, { params: { id: `poll-${pollType}` } })
        const endTime = Date.now()

        expect(response.status).toBe(200)
        performanceResults[pollType] = endTime - startTime
      }

      // All poll types should perform similarly
      const responseTimes = Object.values(performanceResults)
      const maxTime = Math.max(...responseTimes)
      const minTime = Math.min(...responseTimes)
      
      expect(maxTime - minTime).toBeLessThan(200) // Variance should be under 200ms

      console.log('Poll type performance:', performanceResults)
    })
  })

  describe('Public Directory Performance', () => {
    it('should handle large poll listings efficiently', async () => {
      // Mock large dataset
      const mockPolls = Array.from({ length: 1000 }, (_, i) => ({
        _id: `poll${i}`,
        title: `Poll ${i}`,
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [{ id: 'opt1', text: 'Option 1', voteCount: Math.floor(Math.random() * 100) }],
        metadata: { 
          totalVotes: Math.floor(Math.random() * 100), 
          uniqueVoters: Math.floor(Math.random() * 80),
          viewCount: Math.floor(Math.random() * 200)
        },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        creatorId: `user${i % 10}`
      }))

      // Mock paginated response (20 polls per page)
      const paginatedPolls = mockPolls.slice(0, 20)

      ;(Poll.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(paginatedPolls)
              })
            })
          })
        })
      })
      ;(Poll.countDocuments as jest.Mock).mockResolvedValue(1000)

      const startTime = Date.now()

      const publicRequest = new NextRequest('http://localhost:3000/api/polls/public?page=1&limit=20&sortBy=popular')
      const response = await PublicGET(publicRequest)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second

      const data = await response.json()
      expect(data.polls).toHaveLength(20)
      expect(data.pagination.totalCount).toBe(1000)

      console.log(`Public directory query (1000 total polls) completed in ${duration}ms`)
    })

    it('should handle complex filtering and sorting efficiently', async () => {
      const mockPolls = Array.from({ length: 50 }, (_, i) => ({
        _id: `poll${i}`,
        title: `Test Poll ${i}`,
        type: i % 2 === 0 ? 'single' : 'multiple',
        category: i % 3 === 0 ? 'technology' : 'general',
        privacy: 'public',
        status: 'active',
        tags: [`tag${i % 5}`, `category${i % 3}`],
        options: [{ id: 'opt1', text: 'Option 1', voteCount: i * 2 }],
        metadata: { 
          totalVotes: i * 2, 
          uniqueVoters: i,
          viewCount: i * 3
        },
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        creatorId: `user${i % 5}`
      }))

      ;(Poll.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPolls.slice(0, 20))
              })
            })
          })
        })
      })
      ;(Poll.countDocuments as jest.Mock).mockResolvedValue(50)

      const complexQueries = [
        '?search=test&category=technology&sortBy=popular',
        '?type=single&tags=tag1,tag2&sortBy=newest',
        '?minVotes=10&maxVotes=50&sortBy=votes',
        '?dateRange=week&hasDescription=true&sortBy=trending'
      ]

      for (const query of complexQueries) {
        const startTime = Date.now()
        
        const request = new NextRequest(`http://localhost:3000/api/polls/public${query}`)
        const response = await PublicGET(request)
        
        const endTime = Date.now()
        const duration = endTime - startTime

        expect(response.status).toBe(200)
        expect(duration).toBeLessThan(800) // Complex queries under 800ms

        console.log(`Complex query "${query}" completed in ${duration}ms`)
      }
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during high-volume operations', async () => {
      const mockPoll = {
        _id: 'memory-test-poll',
        title: 'Memory Test Poll',
        type: 'single',
        privacy: 'public',
        status: 'active',
        options: [{ id: 'opt1', text: 'Option 1', voteCount: 0 }],
        metadata: { totalVotes: 0, uniqueVoters: 0 }
      }

      ;(Poll.findById as jest.Mock).mockResolvedValue(mockPoll)
      ;(Vote.findOne as jest.Mock).mockResolvedValue(null)
      ;(Vote.prototype.save as jest.Mock).mockResolvedValue({})

      const initialMemory = process.memoryUsage()

      // Perform 500 operations
      for (let i = 0; i < 500; i++) {
        const voteRequest = new NextRequest('http://localhost:3000/api/polls/memory-test-poll/vote', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Forwarded-For': `10.0.0.${(i % 255) + 1}`
          },
          body: JSON.stringify({
            selectedOptions: ['opt1']
          })
        })

        await VotePOST(voteRequest, { params: { id: 'memory-test-poll' } })

        // Force garbage collection every 100 operations
        if (i % 100 === 0 && global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)

      console.log(`Memory usage after 500 operations:`)
      console.log(`  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })
  })
})