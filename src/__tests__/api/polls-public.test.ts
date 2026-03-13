import { NextRequest } from 'next/server'
import { GET } from '@/app/api/polls/public/route'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'

// Mock the database connection
jest.mock('@/lib/mongodb')
jest.mock('@/models/Poll')

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockPoll = Poll as jest.Mocked<typeof Poll>

describe('/api/polls/public', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnectDB.mockResolvedValue(undefined)
  })

  describe('GET /api/polls/public', () => {
    it('should return public polls with default parameters', async () => {
      // Mock data
      const mockPolls = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Poll 1',
          description: 'A test poll',
          type: 'single',
          privacy: 'public',
          status: 'active',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          metadata: {
            totalVotes: 100,
            uniqueVoters: 80,
            viewCount: 200
          },
          options: [
            { id: 'opt1', text: 'Option 1', voteCount: 60 },
            { id: 'opt2', text: 'Option 2', voteCount: 40 }
          ],
          creatorId: '507f1f77bcf86cd799439012'
        }
      ]

      // Mock Poll methods
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPolls)
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(1)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/polls/public')

      // Call the API
      const response = await GET(request as any)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.polls).toHaveLength(1)
      expect(data.polls[0].title).toBe('Test Poll 1')
      expect(data.polls[0].popularity).toBeDefined()
      expect(data.polls[0].popularity.totalVotes).toBe(100)
      expect(data.polls[0].options[0].percentage).toBe(60)
      expect(data.polls[0].options[1].percentage).toBe(40)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.currentPage).toBe(1)
      expect(data.pagination.totalCount).toBe(1)
    })

    it('should filter polls by search query', async () => {
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/polls/public?search=climate')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.search).toBe('climate')
      
      // Verify the search query was applied (now includes tags)
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { title: { $regex: 'climate', $options: 'i' } },
            { description: { $regex: 'climate', $options: 'i' } },
            { tags: { $elemMatch: { $regex: 'climate', $options: 'i' } } }
          ]
        })
      )
    })

    it('should filter polls by type', async () => {
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/polls/public?type=single')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.type).toBe('single')
      
      // Verify the type filter was applied
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'single'
        })
      )
    })

    it('should sort polls by popularity (default)', async () => {
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/polls/public')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.sortBy).toBe('popular')
      
      // Verify the sort was applied
      const mockSort = mockPoll.find().populate().sort as jest.Mock
      expect(mockSort).toHaveBeenCalledWith({
        'metadata.totalVotes': -1,
        'metadata.uniqueVoters': -1
      })
    })

    it('should handle trending sort with aggregation pipeline', async () => {
      const mockAggregateResult = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Trending Poll',
          type: 'single',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { totalVotes: 50, uniqueVoters: 40, viewCount: 100 },
          options: [{ id: 'opt1', text: 'Option 1', voteCount: 30 }],
          trendingScore: 95.5,
          creator: [{ _id: '507f1f77bcf86cd799439012', email: 'test@example.com' }]
        }
      ]

      mockPoll.aggregate.mockResolvedValueOnce(mockAggregateResult)
      mockPoll.aggregate.mockResolvedValueOnce([{ total: 1 }])

      const request = new NextRequest('http://localhost:3000/api/polls/public?sortBy=trending')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.sortBy).toBe('trending')
      expect(mockPoll.aggregate).toHaveBeenCalledTimes(2) // Once for data, once for count
    })

    it('should apply pagination correctly', async () => {
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(100)

      const request = new NextRequest('http://localhost:3000/api/polls/public?page=3&limit=10')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.currentPage).toBe(3)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.totalCount).toBe(100)
      expect(data.pagination.totalPages).toBe(10)
      expect(data.pagination.hasNextPage).toBe(true)
      expect(data.pagination.hasPrevPage).toBe(true)

      // Verify skip and limit were applied correctly
      const mockSkip = mockPoll.find().populate().sort().skip as jest.Mock
      const mockLimit = mockPoll.find().populate().sort().skip().limit as jest.Mock
      expect(mockSkip).toHaveBeenCalledWith(20) // (page 3 - 1) * limit 10
      expect(mockLimit).toHaveBeenCalledWith(10)
    })

    it('should enforce maximum limit of 50', async () => {
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/polls/public?limit=100')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.limit).toBe(50) // Should be capped at 50

      const mockLimit = mockPoll.find().populate().sort().skip().limit as jest.Mock
      expect(mockLimit).toHaveBeenCalledWith(50)
    })

    it('should only return public polls', async () => {
      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/polls/public')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      // Verify only public polls are queried
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          privacy: 'public',
          status: 'active'
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPoll.find.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/polls/public')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch public polls')
    })

    it('should calculate popularity metrics correctly', async () => {
      const mockPolls = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Poll',
          type: 'single',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(), // Recent update
          metadata: {
            totalVotes: 150,
            uniqueVoters: 120,
            viewCount: 300
          },
          options: [
            { id: 'opt1', text: 'Option 1', voteCount: 90 },
            { id: 'opt2', text: 'Option 2', voteCount: 60 }
          ],
          creatorId: '507f1f77bcf86cd799439012'
        }
      ]

      mockPoll.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPolls)
              })
            })
          })
        })
      } as any)

      mockPoll.countDocuments.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/polls/public')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      const poll = data.polls[0]
      
      expect(poll.popularity.totalVotes).toBe(150)
      expect(poll.popularity.uniqueVoters).toBe(120)
      expect(poll.popularity.engagementRate).toBe(50) // 150/300 * 100
      expect(poll.popularity.trendingScore).toBeGreaterThan(0)
      expect(poll.options[0].percentage).toBe(60) // 90/150 * 100
      expect(poll.options[1].percentage).toBe(40) // 60/150 * 100
    })
  })
})