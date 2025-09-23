import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get task statistics
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      todayTasks,
      thisWeekTasks
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({
        where: { userId: session.user.id }
      }),
      
      // Completed tasks
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: 'COMPLETED'
        }
      }),
      
      // Pending tasks
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: 'PENDING'
        }
      }),
      
      // In progress tasks
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: 'IN_PROGRESS'
        }
      }),
      
      // Overdue tasks
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() }
        }
      }),
      
      // Tasks due today
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Tasks due this week
      prisma.task.count({
        where: { 
          userId: session.user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get priority breakdown
    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: { 
        userId: session.user.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      _count: true
    })

    const priorityBreakdown = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }

    priorityStats.forEach(stat => {
      priorityBreakdown[stat.priority] = stat._count
    })

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentActivity = await prisma.task.groupBy({
      by: ['createdAt'],
      where: {
        userId: session.user.id,
        createdAt: { gte: sevenDaysAgo }
      },
      _count: true,
      orderBy: { createdAt: 'asc' }
    })

    // Get productivity trend (tasks completed per day for last 7 days)
    const productivityTrend = await prisma.task.groupBy({
      by: ['completedAt'],
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo }
      },
      _count: true,
      orderBy: { completedAt: 'asc' }
    })

    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        todayTasks,
        thisWeekTasks,
        completionRate
      },
      priorities: priorityBreakdown,
      activity: {
        recent: recentActivity,
        productivity: productivityTrend
      }
    })

  } catch (error) {
    console.error('Dashboard Stats API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
