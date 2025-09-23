import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    console.log('Contact API: Starting request processing')
    
    const session = await getServerSession(authOptions)
    console.log('Contact API: Session:', !!session)
    
    const body = await request.json()
    console.log('Contact API: Request body received:', { 
      hasName: !!body.name, 
      hasEmail: !!body.email, 
      hasMessage: !!body.message 
    })
    
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      console.log('Contact API: Validation failed - missing fields')
      return NextResponse.json({ 
        error: 'Name, email, and message are required' 
      }, { status: 400 })
    }

    // Validate field lengths
    if (name.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Name must be at least 2 characters long' 
      }, { status: 400 })
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Message must be at least 10 characters long' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Contact API: Invalid email format')
      return NextResponse.json({ 
        error: 'Please provide a valid email address' 
      }, { status: 400 })
    }

    // Get user ID if authenticated
    let userId = null
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })
        userId = user?.id || null
        console.log('Contact API: User found:', !!userId)
      } catch (userError) {
        console.error('Contact API: Error finding user:', userError)
        // Continue without userId - anonymous submission
      }
    }

    console.log('Contact API: Creating contact message...')
    
    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        userId: userId
      }
    })

    console.log('Contact message created successfully:', {
      id: contactMessage.id,
      name: contactMessage.name,
      email: contactMessage.email,
      userId: userId,
      authenticated: !!session
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Your message has been sent successfully! We\'ll get back to you soon.',
      contactMessage: {
        id: contactMessage.id,
        createdAt: contactMessage.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Contact API: Error creating contact message:', error)
    console.error('Contact API: Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    })
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A message with this information already exists' 
      }, { status: 409 })
    }
    
    if (error.code?.startsWith('P')) {
      return NextResponse.json({ 
        error: 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow authenticated admin users to view contact messages
    // For now, we'll check if user exists - you can add admin role later
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where = {}
    if (status && ['NEW', 'READ', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      where.status = status
    }

    // Get contact messages with pagination
    const [contactMessages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.contactMessage.count({ where })
    ])

    return NextResponse.json({ 
      contactMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching contact messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
