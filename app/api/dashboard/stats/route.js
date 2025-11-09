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

    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD format
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const todayEnd = new Date(now.setHours(23, 59, 59, 999))
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const weekFromNowString = weekFromNow.toISOString().split('T')[0]

    // ✅ FIX: Base filter to exclude deleted tasks
    const baseWhere = {
      userId: session.user.id,
      deletedTask: { is: null }  // ✅ EXCLUDE TRASHED TASKS
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
      // Total tasks (excluding deleted)
      prisma.task.count({
        where: baseWhere
      }),
      
      // Completed tasks
      prisma.task.count({
        where: { 
          ...baseWhere,
          status: 'COMPLETED'
        }
      }),
      
      // Pending tasks
      prisma.task.count({
        where: { 
          ...baseWhere,
          status: 'PENDING'
        }
      }),
      
      // In progress tasks
      prisma.task.count({
        where: { 
          ...baseWhere,
          status: 'IN_PROGRESS'
        }
      }),
      
      // Overdue tasks - Fixed to handle both dueDate and dueDateDay
      prisma.task.count({
        where: { 
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          OR: [
            // Tasks with specific datetime that are overdue
            {
              dueDate: { lt: now },
              NOT: { dueDate: null }
            },
            // Tasks with date-only that are overdue
            {
              dueDate: null,
              dueDateDay: { lt: today },
              NOT: { dueDateDay: null }
            }
          ]
        }
      }),
      
      // Tasks due today - Fixed to handle both date types
      prisma.task.count({
        where: { 
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          OR: [
            // Tasks with specific datetime due today
            {
              dueDate: {
                gte: todayStart,
                lte: todayEnd
              },
              NOT: { dueDate: null }
            },
            // Tasks with date-only due today
            {
              dueDate: null,
              dueDateDay: today,
              NOT: { dueDateDay: null }
            }
          ]
        }
      }),
      
      // Tasks due this week - Fixed to handle both date types
      prisma.task.count({
        where: { 
          ...baseWhere,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          OR: [
            // Tasks with specific datetime due this week
            {
              dueDate: {
                gte: now,
                lte: weekFromNow
              },
              NOT: { dueDate: null }
            },
            // Tasks with date-only due this week
            {
              dueDate: null,
              dueDateDay: {
                gte: today,
                lte: weekFromNowString
              },
              NOT: { dueDateDay: null }
            }
          ]
        }
      })
    ])

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get priority breakdown (excluding deleted)
    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: { 
        ...baseWhere,
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

    // Get recent activity (last 7 days, excluding deleted)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const recentActivity = await prisma.task.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Process recent activity to group by date
    const activityByDate = recentActivity.reduce((acc, task) => {
      const date = task.createdAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Get productivity trend (excluding deleted)
    const completedTasksLastWeek = await prisma.task.findMany({
      where: {
        ...baseWhere,
        status: 'COMPLETED',
        completedAt: { 
          gte: sevenDaysAgo,
          not: null
        }
      },
      select: {
        completedAt: true
      },
      orderBy: { completedAt: 'asc' }
    })

    // Process productivity trend to group by date
    const productivityByDate = completedTasksLastWeek.reduce((acc, task) => {
      const date = task.completedAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Convert to array format for charts
    const recentActivityArray = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count
    }))

    const productivityTrendArray = Object.entries(productivityByDate).map(([date, count]) => ({
      date,
      count
    }))

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
        recent: recentActivityArray,
        productivity: productivityTrendArray
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