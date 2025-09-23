// api/test/send-reminder.js - For testing reminder emails
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTaskReminder, sendDailyTaskSummary } from '@/lib/task-reminders'

export async function POST(request) {
  try {
    // Only allow in development or with proper auth
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { type, taskId, userId } = body

    if (type === 'task_reminder') {
      // Test individual task reminder
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId: userId,
          deletedTask: null
        }
      })

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!task || !user) {
        return NextResponse.json({ error: 'Task or user not found' }, { status: 404 })
      }

      const result = await sendTaskReminder(task, user, 'DUE_DATE')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test reminder sent',
        result 
      })

    } else if (type === 'daily_summary') {
      // Test daily summary email
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      const tasks = await prisma.task.findMany({
        where: {
          userId: userId,
          deletedTask: null,
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const result = await sendDailyTaskSummary(user, tasks)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test daily summary sent',
        tasksCount: tasks.length,
        result 
      })

    } else {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Test reminder API error:', error)
    return NextResponse.json(
      { error: 'Failed to send test reminder', details: error.message },
      { status: 500 }
    )
  }
}

// GET method for simple testing
export async function GET(request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's tasks with reminders enabled
  const tasksWithReminders = await prisma.task.count({
    where: {
      userId: session.user.id,
      deletedTask: null,
      reminders: {
        path: ['enabled'],
        equals: true
      }
    }
  })

  // Get pending reminders for this user
  const pendingReminders = await prisma.reminderQueue.count({
    where: {
      userId: session.user.id,
      status: 'PENDING'
    }
  })

  return NextResponse.json({
    message: 'Reminder system status',
    user: {
      id: session.user.id,
      email: session.user.email
    },
    stats: {
      tasksWithReminders,
      pendingReminders
    }
  })
}