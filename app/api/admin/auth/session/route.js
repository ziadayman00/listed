import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    console.log('🔍 Checking admin session')
    
    // Get admin token from cookies
    const adminToken = request.cookies.get('admin-token')?.value

    if (!adminToken) {
      console.log('❌ No admin token found')
      return NextResponse.json({ 
        authenticated: false,
        error: 'No admin session found' 
      }, { status: 401 })
    }

    // Verify JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    let decoded
    
    try {
      decoded = jwt.verify(adminToken, jwtSecret)
    } catch (jwtError) {
      console.log('❌ Invalid admin token:', jwtError.message)
      return NextResponse.json({ 
        authenticated: false,
        error: 'Invalid admin session' 
      }, { status: 401 })
    }

    // Verify admin user still exists and is active
    const adminUser = await prisma.adminUser.findUnique({
      where: { 
        id: decoded.adminId,
        isActive: true 
      },
      select: {
        id: true,
        email: true,
        isMainAdmin: true,
        lastLoginAt: true,
        isEmailVerified: true,
        createdAt: true
      }
    })

    if (!adminUser) {
      console.log('❌ Admin user not found or inactive')
      return NextResponse.json({ 
        authenticated: false,
        error: 'Admin account not found or inactive' 
      }, { status: 401 })
    }

    console.log('✅ Valid admin session for:', adminUser.email)

    return NextResponse.json({
      authenticated: true,
      admin: adminUser
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Admin session check error:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
