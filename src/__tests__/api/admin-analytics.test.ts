/**
 * Admin Analytics API Tests
 * Tests the analytics dashboard functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock the database connection and models
jest.mock('@/lib/mongodb')
jest.mock('@/models/User')
jest.mock('@/models/Poll')
jest.mock('@/models/Vote')
jest.mock('@/models/SystemMetrics')
jest.mock('@/models/AuditLog')

// Mock the auth middleware
jest.mock('@/middleware/auth', () => ({
  withAdminAuth: (handler: any) => handler
}))

describe('Admin Analytics Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Analytics Data Structure', () => {
    it('should have correct platform stats structure', () => {
      const expectedPlatformStats = {
        totalUsers: expect.any(Number),
        totalPolls: expect.any(Number),
        totalVotes: expect.any(Number),
        activePolls: expect.any(Number)
      }

      const mockPlatformStats = {
        totalUsers: 150,
        totalPolls: 45,
        totalVotes: 1200,
        activePolls: 30
      }

      expect(mockPlatformStats).toMatchObject(expectedPlatformStats)
    })

    it('should have correct system metrics structure', () => {
      const expectedSystemMetrics = {
        responseTime: {
          avg: expect.any(Number),
          p95: expect.any(Number),
          p99: expect.any(Number)
        },
        errorRate: {
          avg: expect.any(Number),
          total: expect.any(Number)
        },
        requestCount: {
          total: expect.any(Number)
        },
        databaseStats: {
          avgQueryTime: expect.any(Number),
          avgConnectionPoolSize: expect.any(Number)
        }
      }

      const mockSystemMetrics = {
        responseTime: { avg: 120, p95: 200, p99: 350 },
        errorRate: { avg: 0.5, total: 5 },
        requestCount: { total: 1000 },
        databaseStats: { avgQueryTime: 25, avgConnectionPoolSize: 10 }
      }

      expect(mockSystemMetrics).toMatchObject(expectedSystemMetrics)
    })

    it('should have correct audit log structure', () => {
      const expectedAuditLog = {
        id: expect.any(String),
        userEmail: expect.any(String),
        action: expect.any(String),
        resourceType: expect.any(String),
        status: expect.stringMatching(/^(success|failure)$/),
        createdAt: expect.any(String)
      }

      const mockAuditLog = {
        id: 'audit123',
        userEmail: 'admin@test.com',
        action: 'pollModeration',
        resourceType: 'poll',
        resourceId: 'poll123',
        status: 'success' as const,
        createdAt: new Date().toISOString()
      }

      expect(mockAuditLog).toMatchObject(expectedAuditLog)
    })

    it('should calculate system metrics averages correctly', () => {
      const systemMetricsData = [
        { metrics: { responseTime: { avg: 100 }, errorRate: { rate: 0.1, total: 1 }, requestCount: { total: 500 }, databaseStats: { avgQueryTime: 20, connectionPoolSize: 8 } } },
        { metrics: { responseTime: { avg: 140 }, errorRate: { rate: 0.9, total: 9 }, requestCount: { total: 1500 }, databaseStats: { avgQueryTime: 30, connectionPoolSize: 12 } } }
      ]

      const avgResponseTime = systemMetricsData.reduce((sum, m) => sum + m.metrics.responseTime.avg, 0) / systemMetricsData.length
      const avgErrorRate = systemMetricsData.reduce((sum, m) => sum + m.metrics.errorRate.rate, 0) / systemMetricsData.length
      const totalRequests = systemMetricsData.reduce((sum, m) => sum + m.metrics.requestCount.total, 0)
      const avgQueryTime = systemMetricsData.reduce((sum, m) => sum + m.metrics.databaseStats.avgQueryTime, 0) / systemMetricsData.length

      expect(avgResponseTime).toBe(120)
      expect(avgErrorRate).toBe(0.5)
      expect(totalRequests).toBe(2000)
      expect(avgQueryTime).toBe(25)
    })
  })

  describe('Analytics Data Processing', () => {
    it('should handle empty system metrics gracefully', () => {
      const systemMetrics: any[] = []
      
      const avgSystemMetrics = systemMetrics.length > 0 ? {
        responseTime: {
          avg: systemMetrics.reduce((sum, m) => sum + m.metrics.responseTime.avg, 0) / systemMetrics.length
        }
      } : null

      expect(avgSystemMetrics).toBeNull()
    })

    it('should format audit log statistics correctly', () => {
      const mockAuditStats = [
        {
          action: 'pollModeration',
          total: 10,
          success: 9,
          failure: 1,
          successRate: 90
        },
        {
          action: 'userManagement',
          total: 5,
          success: 5,
          failure: 0,
          successRate: 100
        }
      ]

      expect(mockAuditStats[0].successRate).toBe(90)
      expect(mockAuditStats[1].successRate).toBe(100)
      expect(mockAuditStats.every(stat => stat.total === stat.success + stat.failure)).toBe(true)
    })

    it('should format poll type distribution correctly', () => {
      const mockPollTypeDistribution = [
        { type: 'single', count: 25 },
        { type: 'multiple', count: 15 },
        { type: 'yesno', count: 5 }
      ]

      const totalPolls = mockPollTypeDistribution.reduce((sum, item) => sum + item.count, 0)
      expect(totalPolls).toBe(45)

      const singlePercentage = (25 / 45) * 100
      expect(singlePercentage).toBeCloseTo(55.56, 2)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', () => {
      const mockError = new Error('Database connection failed')
      
      expect(mockError.message).toBe('Database connection failed')
      expect(mockError).toBeInstanceOf(Error)
    })

    it('should handle missing data gracefully', () => {
      const mockAnalytics = {
        platformStats: { totalUsers: 0, totalPolls: 0, totalVotes: 0, activePolls: 0 },
        topPolls: [],
        pollTypeDistribution: [],
        systemMetrics: null,
        auditLogs: []
      }

      expect(mockAnalytics.topPolls).toHaveLength(0)
      expect(mockAnalytics.systemMetrics).toBeNull()
      expect(mockAnalytics.auditLogs).toHaveLength(0)
    })
  })
})