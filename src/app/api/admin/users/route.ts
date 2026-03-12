import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/auth'
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

    await connectDB()

    // Build query
    const query: any = {}
    
    if (search) {
      query.email = { $regex: search, $options: 'i' }
    }
    
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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
 * Update user role or status (admin only)
 */
async function updateUser(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { userId, role, emailVerified } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const updateData: any = {}
    
    if (role && ['user', 'admin'].includes(role)) {
      updateData.role = role
    }
    
    if (typeof emailVerified === 'boolean') {
      updateData.emailVerified = emailVerified
    }

    updateData.updatedAt = new Date()

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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

// Apply admin authentication middleware
export const GET = withAdminAuth(getUsers)
export const PUT = withAdminAuth(updateUser)
export const DELETE = withAdminAuth(deleteUser)