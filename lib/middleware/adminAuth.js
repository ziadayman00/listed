import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Verify admin authentication from request cookies
 * @param {Request} request - Next.js request object
 * @returns {Promise<{success: boolean, admin?: object, response?: NextResponse}>}
 */
export async function verifyAdminAuth(request) {
  try {
    // Get admin token from cookies
    const adminToken = request.cookies.get('admin-token')?.value

    if (!adminToken) {
      console.log('❌ No admin token found')
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Verify JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    let decoded
    
    try {
      decoded = jwt.verify(adminToken, jwtSecret)
    } catch (jwtError) {
      console.log('❌ Invalid admin token:', jwtError.message)
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    })

    if (!adminUser) {
      console.log('❌ Admin user not found or inactive')
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('👤 Admin authenticated:', adminUser.email)
    return {
      success: true,
      admin: adminUser
    }

  } catch (error) {
    console.error('❌ Admin auth verification error:', error)
    return {
      success: false,
      response: NextResponse.json({ 
        error: 'Authentication error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }
  }
}

/**
 * Verify admin authentication and require main admin role
 * @param {Request} request - Next.js request object
 * @returns {Promise<{success: boolean, admin?: object, response?: NextResponse}>}
 */
export async function verifyMainAdminAuth(request) {
  const authResult = await verifyAdminAuth(request)
  
  if (!authResult.success) {
    return authResult
  }

  if (!authResult.admin.isMainAdmin) {
    console.log('❌ Not main admin - access denied')
    return {
      success: false,
      response: NextResponse.json({ 
        error: 'Access denied. Main admin role required.' 
      }, { status: 403 })
    }
  }

  return authResult
}
