import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withAdminRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/admin/users
 * Get list of all users (admin only)
 */
async function getUsers(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    await connectDB()

    // Build query
    const query: any = {}
    
    if (search) {
      query.email = { $regex: search, $options: 'i' }
    }
    
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role
    }

    if (status && ['active', 'suspended', 'banned'].includes(status)) {
      query.status = status
    }

    // Get total count
    const total = await User.countDocuments(query)

    // Get users with pagination
    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      success: true,
      users: users.map((user: any) => ({
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
        bannedAt: user.bannedAt,
        banReason: user.banReason,
        activityLog: user.activityLog,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users
 * Update user role, status, or suspend/ban user (admin only)
 */
async function updateUser(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { userId, role, emailVerified, action, suspendedUntil, reason } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Handle suspension/banning actions
    if (action) {
      switch (action) {
        case 'suspend':
          if (!suspendedUntil) {
            return NextResponse.json(
              { error: 'Suspension end date is required' },
              { status: 400 }
            )
          }
          await user.suspend(new Date(suspendedUntil), reason || 'No reason provided')
          break
        
        case 'ban':
          await user.ban(reason || 'No reason provided')
          break
        
        case 'unsuspend':
          await user.unsuspend()
          break
        
        case 'unban':
          await user.unban()
          break
        
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          )
      }
    } else {
      // Handle regular updates
      const updateData: any = {}
      
      if (role && ['user', 'admin'].includes(role)) {
        updateData.role = role
      }
      
      if (typeof emailVerified === 'boolean') {
        updateData.emailVerified = emailVerified
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date()
        Object.assign(user, updateData)
        await user.save()
      }
    }

    const updatedUser = await User.findById(userId).select('-passwordHash')

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser!._id,
        email: updatedUser!.email,
        role: updatedUser!.role,
        emailVerified: updatedUser!.emailVerified,
        status: updatedUser!.status,
        suspendedUntil: updatedUser!.suspendedUntil,
        suspensionReason: updatedUser!.suspensionReason,
        bannedAt: updatedUser!.bannedAt,
        banReason: updatedUser!.banReason,
        activityLog: updatedUser!.activityLog,
        createdAt: updatedUser!.createdAt,
        updatedAt: updatedUser!.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user account (admin only)
 */
async function deleteUser(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// Apply admin authentication middleware with rate limiting
export const GET = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(getUsers)
export const PUT = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(updateUser)
export const DELETE = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(deleteUser)