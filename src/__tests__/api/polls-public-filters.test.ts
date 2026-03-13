import { NextRequest } from 'next/server'
import { GET } from '@/app/api/polls/public/route'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'

// Mock the database connection
jest.mock('@/lib/mongodb')
jest.mock('@/models/Poll')

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockPoll = Poll as jest.Mocked<typeof Poll>

describe('/api/polls/public - Advanced Filtering and Sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnectDB.mockResolvedValue(undefined)
  })

  describe('Category Filtering', () => {
    it('should filter polls by category', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?category=technology')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.category).toBe('technology')
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'technology'
        })
      )
    })

    it('should not filter when category is "all"', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?category=all')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.not.objectContaining({
          category: expect.anything()
        })
      )
    })
  })

  describe('Date Range Filtering', () => {
    it('should filter polls by "today" date range', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?dateRange=today')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.dateRange).toBe('today')
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: expect.any(Date)
          })
        })
      )
    })

    it('should filter polls by "week" date range', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?dateRange=week')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: expect.any(Date)
          })
        })
      )
    })

    it('should filter polls by custom date range', async () => {
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

      const dateFrom = '2024-01-01'
      const dateTo = '2024-12-31'
      const request = new NextRequest(
        `http://localhost:3000/api/polls/public?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.dateFrom).toBe(dateFrom)
      expect(data.filters.dateTo).toBe(dateTo)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: new Date(dateFrom),
            $lte: new Date(dateTo)
          })
        })
      )
    })
  })

  describe('Vote Count Filtering', () => {
    it('should filter polls by minimum votes', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?minVotes=100')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.minVotes).toBe(100)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'metadata.totalVotes': expect.objectContaining({
            $gte: 100
          })
        })
      )
    })

    it('should filter polls by maximum votes', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?maxVotes=1000')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.maxVotes).toBe(1000)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'metadata.totalVotes': expect.objectContaining({
            $lte: 1000
          })
        })
      )
    })

    it('should filter polls by vote range', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?minVotes=50&maxVotes=500')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'metadata.totalVotes': expect.objectContaining({
            $gte: 50,
            $lte: 500
          })
        })
      )
    })
  })

  describe('Tag Filtering', () => {
    it('should filter polls by single tag', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?tags=technology')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.tags).toBe('technology')
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['technology'] }
        })
      )
    })

    it('should filter polls by multiple tags', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?tags=technology,ai,future')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['technology', 'ai', 'future'] }
        })
      )
    })
  })

  describe('Popularity-Based Sorting', () => {
    it('should sort by vote count', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?sortBy=votes')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.sortBy).toBe('votes')
      
      const mockSort = mockPoll.find().populate().sort as jest.Mock
      expect(mockSort).toHaveBeenCalledWith({
        'metadata.totalVotes': -1
      })
    })

    it('should sort by view count', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?sortBy=views')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.sortBy).toBe('views')
      
      const mockSort = mockPoll.find().populate().sort as jest.Mock
      expect(mockSort).toHaveBeenCalledWith({
        'metadata.viewCount': -1
      })
    })

    it('should sort by engagement rate using aggregation', async () => {
      const mockAggregateResult = [
        {
          _id: '507f1f77bcf86cd799439011',
          title: 'High Engagement Poll',
          type: 'single',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { totalVotes: 80, uniqueVoters: 70, viewCount: 100 },
          options: [{ id: 'opt1', text: 'Option 1', voteCount: 50 }],
          engagementRate: 0.8,
          creator: [{ _id: '507f1f77bcf86cd799439012' }]
        }
      ]

      mockPoll.aggregate.mockResolvedValueOnce(mockAggregateResult)
      mockPoll.aggregate.mockResolvedValueOnce([{ total: 1 }])

      const request = new NextRequest('http://localhost:3000/api/polls/public?sortBy=engagement')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.sortBy).toBe('engagement')
      expect(mockPoll.aggregate).toHaveBeenCalled()
      
      // Verify aggregation pipeline includes engagement calculation
      const aggregationCall = mockPoll.aggregate.mock.calls[0][0]
      expect(aggregationCall).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $addFields: expect.objectContaining({
              engagementRate: expect.any(Object)
            })
          })
        ])
      )
    })

    it('should sort by recent activity', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?sortBy=recent_activity')

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.sortBy).toBe('recent_activity')
      
      const mockSort = mockPoll.find().populate().sort as jest.Mock
      expect(mockSort).toHaveBeenCalledWith({
        updatedAt: -1
      })
    })
  })

  describe('Combined Filters', () => {
    it('should apply multiple filters simultaneously', async () => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/polls/public?category=technology&type=single&minVotes=50&dateRange=week&sortBy=votes'
      )

      const response = await GET(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.category).toBe('technology')
      expect(data.filters.type).toBe('single')
      expect(data.filters.minVotes).toBe(50)
      expect(data.filters.dateRange).toBe('week')
      expect(data.filters.sortBy).toBe('votes')
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'technology',
          type: 'single',
          'metadata.totalVotes': expect.objectContaining({
            $gte: 50
          }),
          createdAt: expect.objectContaining({
            $gte: expect.any(Date)
          })
        })
      )
    })

    it('should handle search with category and date filters', async () => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/polls/public?search=climate&category=environment&dateRange=month'
      )

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      // Should have both search and category filters
      const findCall = mockPoll.find.mock.calls[0][0]
      expect(findCall).toMatchObject({
        category: 'environment',
        createdAt: expect.any(Object)
      })
      // Search creates $or condition
      expect(findCall.$or).toBeDefined()
    })
  })

  describe('Advanced Search Functionality', () => {
    it('should search in title, description, and tags', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?search=artificial intelligence')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      expect(mockPoll.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { title: { $regex: 'artificial intelligence', $options: 'i' } },
            { description: { $regex: 'artificial intelligence', $options: 'i' } },
            { tags: { $elemMatch: { $regex: 'artificial intelligence', $options: 'i' } } }
          ]
        })
      )
    })

    it('should handle empty search gracefully', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/polls/public?search=   ')

      const response = await GET(request as any)

      expect(response.status).toBe(200)
      
      // Should not apply search filter for empty/whitespace search
      // The $or in the query should only be for expiration date, not search
      const findCall = mockPoll.find.mock.calls[0][0]
      expect(findCall).toMatchObject({
        privacy: 'public',
        status: 'active'
      })
      // Check that $or is only for expiration, not for search (title/description/tags)
      if (findCall.$or) {
        const hasSearchOr = findCall.$or.some((condition: any) => 
          condition.title || condition.description || condition.tags
        )
        expect(hasSearchOr).toBe(false)
      }
    })
  })
})
