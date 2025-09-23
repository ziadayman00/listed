import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/middleware/adminAuth'

export async function GET(request) {
  try {
    console.log('🚀 Dashboard API called')
    
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { admin } = authResult

    console.log('📊 Fetching basic counts...')

    // Get basic counts first
    const totalUsers = await prisma.user.count()
    console.log('Users count:', totalUsers)

    const totalContacts = await prisma.contactMessage.count()
    console.log('Contacts count:', totalContacts)

    const totalSupportTickets = await prisma.supportTicket.count()
    console.log('Support tickets count:', totalSupportTickets)

    const openSupportTickets = await prisma.supportTicket.count({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      }
    })
    console.log('Open support tickets:', openSupportTickets)

    const newContactsThisMonth = await prisma.contactMessage.count({
      where: {
        status: 'NEW'
      }
    })
    console.log('New contacts:', newContactsThisMonth)

    // Get recent activities
    console.log('📋 Fetching recent activities...')
    
    const recentContacts = await prisma.contactMessage.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        createdAt: true
      }
    })
    console.log('Recent contacts:', recentContacts.length)

    const recentTickets = await prisma.supportTicket.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    console.log('Recent tickets:', recentTickets.length)

    // Get recent user activities
    const recentUserActivities = await prisma.userActivity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      }
    })
    console.log('Recent user activities:', recentUserActivities.length)

    // Format recent activities
    const formattedActivities = []

    // Add recent user activities
    recentUserActivities.forEach(activity => {
      const user = activity.user
      const activityMessage = activity.description || `User ${activity.type.toLowerCase().replace('_', ' ')}`
      const provider = activity.metadata?.provider || 'unknown'
      
      const formattedActivity = {
        id: `activity-${activity.id}`,
        type: 'user_activity',
        message: `${user?.name || user?.email || 'User'} ${activityMessage.toLowerCase()}`,
        time: activity.createdAt,
        icon: activity.type === 'LOGIN' ? 'LogIn' : 
              activity.type === 'LOGOUT' ? 'LogOut' :
              activity.type === 'REGISTER' ? 'UserPlus' : 'User',
        color: activity.type === 'LOGIN' ? 'text-green-600 bg-green-100' :
               activity.type === 'LOGOUT' ? 'text-gray-600 bg-gray-100' :
               activity.type === 'REGISTER' ? 'text-purple-600 bg-purple-100' : 
               'text-blue-600 bg-blue-100',
        metadata: {
          provider: provider,
          email: user?.email,
          image: user?.image
        }
      }
      
      console.log('📋 Adding user activity:', formattedActivity.message, 'Type:', activity.type)
      formattedActivities.push(formattedActivity)
    })

    // Add recent contacts
    recentContacts.forEach(contact => {
      formattedActivities.push({
        id: `contact-${contact.id}`,
        type: 'contact',
        message: `New contact message from ${contact.name}`,
        time: contact.createdAt,
        icon: 'Mail',
        color: 'text-blue-600 bg-blue-100'
      })
    })

    // Add recent support tickets
    recentTickets.forEach(ticket => {
      formattedActivities.push({
        id: `ticket-${ticket.id}`,
        type: 'support',
        message: `New support ticket: ${ticket.subject}`,
        time: ticket.createdAt,
        icon: 'MessageSquare',
        color: 'text-orange-600 bg-orange-100'
      })
    })

    // Sort activities by time (most recent first)
    formattedActivities.sort((a, b) => new Date(b.time) - new Date(a.time))

    // Return dashboard data
    const dashboardData = {
      stats: {
        users: {
          total: totalUsers,
          new: 0, // Simplified for now
          growth: 0
        },
        contacts: {
          total: totalContacts,
          new: newContactsThisMonth
        },
        support: {
          total: totalSupportTickets,
          open: openSupportTickets,
          new: 0 // Simplified for now
        },
        growth: {
          percentage: 0,
          trend: 'up'
        }
      },
      recentActivities: formattedActivities.slice(0, 8),
      systemStatus: {
        database: 'operational',
        api: 'operational',
        email: 'operational'
      }
    }

    console.log('📊 Total formatted activities:', formattedActivities.length)
    console.log('📊 Activity types:', formattedActivities.map(a => `${a.type}: ${a.message}`))
    console.log('✅ Dashboard data prepared successfully')
    return NextResponse.json(dashboardData, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error)
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
