import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🚪 Admin logout request')

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 })

    // Clear the admin token cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/' // Same path as when setting the cookie
    })

    console.log('✅ Admin logged out successfully')
    return response

  } catch (error) {
    console.error('❌ Admin logout error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
