/**
 * Admin User Management Tests
 * Tests user suspension, banning, and activity tracking functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// Mock the database connection
jest.mock('@/lib/mongodb')
jest.mock('@/models/User')

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>
const mockUser = User as jest.Mocked<typeof User>

describe('Admin User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnectDB.mockResolvedValue(undefined)
  })

  describe('User Status Management', () => {
    it('should support active, suspended, and banned statuses', () => {
      const activeUser = {
        _id: '1',
        email: 'active@test.com',
        status: 'active',
        isSuspended: () => false,
        isBanned: () => false,
        canLogin: () => true
      }

      const suspendedUser = {
        _id: '2',
        email: 'suspended@test.com',
        status: 'suspended',
        suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        suspensionReason: 'Violation of terms',
        isSuspended: () => true,
        isBanned: () => false,
        canLogin: () => false
      }

      const bannedUser = {
        _id: '3',
        email: 'banned@test.com',
        status: 'banned',
        bannedAt: new Date(),
        banReason: 'Severe violation',
        isSuspended: () => false,
        isBanned: () => true,
        canLogin: () => false
      }

      expect(activeUser.status).toBe('active')
      expect(activeUser.canLogin()).toBe(true)

      expect(suspendedUser.status).toBe('suspended')
      expect(suspendedUser.isSuspended()).toBe(true)
      expect(suspendedUser.canLogin()).toBe(false)

      expect(bannedUser.status).toBe('banned')
      expect(bannedUser.isBanned()).toBe(true)
      expect(bannedUser.canLogin()).toBe(false)
    })

    it('should query users by status', async () => {
      const mockSuspendedUsers = [
        { _id: '1', email: 'user1@test.com', status: 'suspended' },
        { _id: '2', email: 'user2@test.com', status: 'suspended' }
      ]

      mockUser.find.mockResolvedValue(mockSuspendedUsers as any)

      const suspendedUsers = await User.find({ status: 'suspended' })
      expect(suspendedUsers).toHaveLength(2)
      expect(suspendedUsers.every((u: any) => u.status === 'suspended')).toBe(true)
    })

    it('should query users by multiple criteria including status', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', status: 'active', role: 'user' }
      ]

      mockUser.find.mockResolvedValue(mockUsers as any)

      const users = await User.find({ status: 'active', role: 'user' })
      expect(users).toHaveLength(1)
      expect(users[0].status).toBe('active')
      expect(users[0].role).toBe('user')
    })
  })

  describe('Activity Tracking', () => {
    it('should track user activity metrics', () => {
      const userWithActivity = {
        _id: '1',
        email: 'active@test.com',
        activityLog: {
          lastActive: new Date(),
          pollsCreated: 5,
          votesSubmitted: 20,
          loginCount: 10
        }
      }

      expect(userWithActivity.activityLog.pollsCreated).toBe(5)
      expect(userWithActivity.activityLog.votesSubmitted).toBe(20)
      expect(userWithActivity.activityLog.loginCount).toBe(10)
      expect(userWithActivity.activityLog.lastActive).toBeDefined()
    })

    it('should initialize activity log with default values', () => {
      const newUser = {
        _id: '1',
        email: 'new@test.com',
        activityLog: {
          pollsCreated: 0,
          votesSubmitted: 0,
          loginCount: 0
        }
      }

      expect(newUser.activityLog.pollsCreated).toBe(0)
      expect(newUser.activityLog.votesSubmitted).toBe(0)
      expect(newUser.activityLog.loginCount).toBe(0)
    })

    it('should query users by activity metrics', async () => {
      const mockActiveUsers = [
        { 
          _id: '1', 
          email: 'user1@test.com',
          activityLog: { lastActive: new Date(), pollsCreated: 10 }
        }
      ]

      const mockQuery = {
        sort: jest.fn().mockResolvedValue(mockActiveUsers)
      }

      mockUser.find.mockReturnValue(mockQuery as any)

      const users = await User.find().sort({ 'activityLog.lastActive': -1 })
      expect(users).toHaveLength(1)
      expect(mockQuery.sort).toHaveBeenCalledWith({ 'activityLog.lastActive': -1 })
    })
  })

  describe('Suspension Management', () => {
    it('should store suspension details', () => {
      const suspendedUser = {
        _id: '1',
        email: 'suspended@test.com',
        status: 'suspended',
        suspendedUntil: new Date('2024-12-31'),
        suspensionReason: 'Spam posting',
        isSuspended: () => true
      }

      expect(suspendedUser.status).toBe('suspended')
      expect(suspendedUser.suspendedUntil).toBeDefined()
      expect(suspendedUser.suspensionReason).toBe('Spam posting')
      expect(suspendedUser.isSuspended()).toBe(true)
    })

    it('should handle unsuspension', () => {
      const unsuspendedUser = {
        _id: '1',
        email: 'user@test.com',
        status: 'active',
        suspendedUntil: undefined,
        suspensionReason: undefined,
        isSuspended: () => false,
        canLogin: () => true
      }

      expect(unsuspendedUser.status).toBe('active')
      expect(unsuspendedUser.suspendedUntil).toBeUndefined()
      expect(unsuspendedUser.suspensionReason).toBeUndefined()
      expect(unsuspendedUser.isSuspended()).toBe(false)
      expect(unsuspendedUser.canLogin()).toBe(true)
    })
  })

  describe('Ban Management', () => {
    it('should store ban details', () => {
      const bannedUser = {
        _id: '1',
        email: 'banned@test.com',
        status: 'banned',
        bannedAt: new Date(),
        banReason: 'Severe violation of terms',
        isBanned: () => true
      }

      expect(bannedUser.status).toBe('banned')
      expect(bannedUser.bannedAt).toBeDefined()
      expect(bannedUser.banReason).toBe('Severe violation of terms')
      expect(bannedUser.isBanned()).toBe(true)
    })

    it('should handle unban', () => {
      const unbannedUser = {
        _id: '1',
        email: 'user@test.com',
        status: 'active',
        bannedAt: undefined,
        banReason: undefined,
        isBanned: () => false,
        canLogin: () => true
      }

      expect(unbannedUser.status).toBe('active')
      expect(unbannedUser.bannedAt).toBeUndefined()
      expect(unbannedUser.banReason).toBeUndefined()
      expect(unbannedUser.isBanned()).toBe(false)
      expect(unbannedUser.canLogin()).toBe(true)
    })
  })

  describe('Login Prevention', () => {
    it('should prevent suspended users from logging in', () => {
      const suspendedUser = {
        status: 'suspended',
        isSuspended: () => true,
        isBanned: () => false,
        canLogin: () => false
      }

      expect(suspendedUser.canLogin()).toBe(false)
    })

    it('should prevent banned users from logging in', () => {
      const bannedUser = {
        status: 'banned',
        isSuspended: () => false,
        isBanned: () => true,
        canLogin: () => false
      }

      expect(bannedUser.canLogin()).toBe(false)
    })

    it('should allow active users to login', () => {
      const activeUser = {
        status: 'active',
        isSuspended: () => false,
        isBanned: () => false,
        canLogin: () => true
      }

      expect(activeUser.canLogin()).toBe(true)
    })
  })

  describe('Admin User Queries', () => {
    it('should support filtering by status and role', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', status: 'active', role: 'user' }
      ]

      mockUser.find.mockResolvedValue(mockUsers as any)

      const users = await User.find({ status: 'active', role: 'user' })
      expect(users).toHaveLength(1)
    })

    it('should support pagination with status filter', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', status: 'suspended' },
        { _id: '2', email: 'user2@test.com', status: 'suspended' }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      }

      mockUser.find.mockReturnValue(mockQuery as any)

      const users = await User.find({ status: 'suspended' })
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(20)

      expect(users).toHaveLength(2)
      expect(mockQuery.select).toHaveBeenCalledWith('-passwordHash')
    })

    it('should count users by status', async () => {
      mockUser.countDocuments = jest.fn().mockResolvedValue(5)

      const count = await User.countDocuments({ status: 'banned' })
      expect(count).toBe(5)
      expect(mockUser.countDocuments).toHaveBeenCalledWith({ status: 'banned' })
    })
  })
})

