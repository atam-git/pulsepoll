import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/user/profile
 * Get current user's profile information
 */
async function getProfile(req: AuthenticatedRequest) {
  try {
    await connectDB()
    
    const user = await User.findById(req.user!.id).select('-passwordHash')
    
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
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile information
 */
async function updateProfile(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { email } = body

    await connectDB()
    
    // Check if email is already taken by another user
    if (email && email !== req.user!.email) {
      const existingUser = await User.findByEmail(email)
      if (existingUser && existingUser._id.toString() !== req.user!.id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { 
        ...(email && { email }),
        updatedAt: new Date()
      },
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
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const GET = withUserAuth(getProfile)
export const PUT = withUserAuth(updateProfile)