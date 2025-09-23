import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's support tickets
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's tickets with messages
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new support ticket
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, description, priority = 'MEDIUM' } = body

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json({ 
        error: 'Subject and description are required' 
      }, { status: 400 })
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority level' 
      }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create support ticket first, then add initial message
    const ticket = await prisma.supportTicket.create({
      data: {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        userId: user.id
      }
    })

    // Create initial message
    await prisma.supportMessage.create({
      data: {
        content: description.trim(),
        isFromUser: true,
        ticketId: ticket.id
      }
    })

    // Fetch the complete ticket with messages
    const completeTicket = await prisma.supportTicket.findUnique({
      where: { id: ticket.id },
      include: {
        messages: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      ticket: completeTicket 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating support ticket:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
