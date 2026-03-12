import { NextRequest, NextResponse } from 'next/server'
import AuthenticationService from '@/services/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    // Validate required fields
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Reset password with token
    const result = await AuthenticationService.resetPassword(token, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset password' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Password reset confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}