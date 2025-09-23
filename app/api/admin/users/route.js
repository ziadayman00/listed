import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/middleware/adminAuth'

export async function GET(request) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const verified = searchParams.get('verified')
    const skip = (page - 1) * limit

    // Build where clause
    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (verified === 'true') {
      where.emailVerified = { not: null }
    } else if (verified === 'false') {
      where.emailVerified = null
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              tasks: true,
              supportTickets: true,
              contactMessages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Update user (for admin actions like verification, blocking, etc.)
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, action, data } = body

    if (!userId || !action) {
      return NextResponse.json({ 
        error: 'User ID and action are required' 
      }, { status: 400 })
    }

    let updateData = {}
    
    switch (action) {
      case 'verify':
        updateData.emailVerified = new Date()
        break
      case 'unverify':
        updateData.emailVerified = null
        break
      case 'update':
        if (data.name) updateData.name = data.name
        if (data.email) updateData.email = data.email
        break
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        _count: {
          select: {
            tasks: true,
            supportTickets: true,
            contactMessages: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    }, { status: 200 })

  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
