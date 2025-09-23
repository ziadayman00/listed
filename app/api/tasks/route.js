import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { scheduleTaskReminder } from '@/lib/reminder-scheduler'

// Enhanced validation schema
// Support either a full ISO `dueDate` or separate `dueDateDay` (YYYY-MM-DD) with optional `dueTime` (HH:mm)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  dueDate: z.string().nullable().optional(),
  dueDateDay: z.string().regex(dateRegex, 'Invalid date format, expected YYYY-MM-DD').nullable().optional(),
  dueTime: z.string().regex(timeRegex, 'Invalid time format, expected HH:mm').nullable().optional(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
  category: z.string().nullable().optional(),
  estimatedTime: z.number().positive('Estimated time must be a positive number').optional(),
  reminders: z.object({
    enabled: z.boolean(),
    time: z.enum(['30min', '1hour', '1day', '1week'])
  }).nullable().optional(),
  isAIGenerated: z.boolean().default(false)
}).refine((data) => {
  // If dueTime is provided, we must have a day either via dueDateDay or dueDate
  if (data?.dueTime && !data?.dueDateDay && !data?.dueDate) return false
  return true
}, { message: 'A date (dueDateDay or dueDate) is required when providing a time', path: ['dueTime'] })

function buildDueDateAndFlag(input) {
  // Returns { dueDate: Date|null, hasDueTime: boolean }
  if (input.dueDate) {
    // Backward compatible: client supplied full ISO string
    return { dueDate: input.dueDate ? new Date(input.dueDate) : null, hasDueTime: !!input.dueDate && !/T00:00:00/.test(input.dueDate) }
  }
  if (!input.dueDateDay) {
    return { dueDate: null, hasDueTime: false }
  }
  const [y, m, d] = input.dueDateDay.split('-').map((v) => parseInt(v, 10))
  // Use local time to avoid timezone surprises
  let hours = 0, minutes = 0
  let hasDueTime = false
  if (input.dueTime) {
    const [hh, mm] = input.dueTime.split(':').map((v) => parseInt(v, 10))
    hours = hh; minutes = mm; hasDueTime = true
  }
  const date = new Date(y, (m - 1), d, hours, minutes, 0, 0)
  return { dueDate: date, hasDueTime }
}

// GET /api/tasks - Enhanced with new filtering capabilities
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')) : 1
    const search = searchParams.get('search')

    // Build where clause
    const where = {
      userId: session.user.id,
      deletedTask: null, // Exclude soft-deleted tasks
      ...(status && { status: status.toUpperCase() }),
      ...(priority && { priority: priority.toUpperCase() }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }, // Search in tags array
          { category: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    // Get total count for pagination
    const totalCount = await prisma.task.count({ where })

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Pending first
        { priority: 'desc' }, // High priority first
        { dueDate: 'asc' }, // Earliest due date first
        { createdAt: 'desc' } // Newest first
      ],
      ...(limit && { take: limit }),
      ...(limit && { skip: (page - 1) * limit })
    })

    return NextResponse.json({
      tasks,
      pagination: limit ? {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      } : null
    })

  } catch (error) {
    console.error('Tasks GET API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Enhanced to handle all new fields
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Prepare task data
    const { dueDate, hasDueTime } = buildDueDateAndFlag(validatedData)
    const taskData = {
      title: validatedData.title.trim(),
      description: validatedData.description?.trim() || null,
      priority: validatedData.priority,
      status: validatedData.status,
      dueDate,
      hasDueTime,
      tags: validatedData.tags || [],
      category: validatedData.category?.trim() || null,
      estimatedTime: validatedData.estimatedTime || null,
      reminders: validatedData.reminders,
      userId: session.user.id,
      isAIGenerated: validatedData.isAIGenerated
    }

    // Create task
    const task = await prisma.task.create({
      data: taskData
    })

    // Schedule reminder if enabled
    try {
      await scheduleTaskReminder(task, session.user.id)
    } catch (reminderError) {
      console.error('Failed to schedule reminder:', reminderError)
      // Don't fail the task creation if reminder scheduling fails
    }

    // Log activity
    try {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          type: 'TASK_CREATED',
          description: `Created task: ${task.title}`,
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
            priority: task.priority,
            category: task.category,
            estimatedTime: task.estimatedTime
          }
        }
      })
    } catch (activityError) {
      console.error('Error logging task creation activity:', activityError)
    }

    return NextResponse.json(task, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Tasks POST API Error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// api/tasks/[id]/route.js - Updated PATCH method with reminder rescheduling
import { rescheduleTaskReminders, cancelTaskReminders } from '@/lib/reminder-scheduler'

// ... existing imports and code ...

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: session.user.id,
        deletedTask: null
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or already deleted' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Prepare update data
    const updateData = {
      ...validatedData,
      updatedAt: new Date()
    }

    // Clean up string fields
    if (validatedData.title) {
      updateData.title = validatedData.title.trim()
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description?.trim() || null
    }
    if (validatedData.category !== undefined) {
      updateData.category = validatedData.category?.trim() || null
    }

    // Handle due date
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }

    // Handle completion timestamp
    if (validatedData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date()
    } else if (validatedData.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
      updateData.completedAt = null
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: id },
      data: updateData
    })

    // Handle reminder scheduling
    try {
      const reminderFieldsChanged = 
        validatedData.reminders !== undefined || 
        validatedData.dueDate !== undefined ||
        validatedData.status !== undefined

      if (reminderFieldsChanged) {
        if (task.status === 'COMPLETED') {
          // Cancel reminders for completed tasks
          await cancelTaskReminders(task.id)
        } else {
          // Reschedule reminders based on new data
          await rescheduleTaskReminders(task, session.user.id)
        }
      }
    } catch (reminderError) {
      console.error('Failed to update reminders:', reminderError)
      // Don't fail the task update if reminder scheduling fails
    }

    // Log activity for significant changes
    if (validatedData.status && validatedData.status !== existingTask.status) {
      try {
        await prisma.userActivity.create({
          data: {
            userId: session.user.id,
            type: 'TASK_UPDATED',
            description: `Updated task "${task.title}" status to ${validatedData.status.toLowerCase().replace('_', ' ')}`,
            metadata: {
              taskId: task.id,
              taskTitle: task.title,
              oldStatus: existingTask.status,
              newStatus: validatedData.status
            }
          }
        })
      } catch (activityError) {
        console.error('Error logging task update activity:', activityError)
      }
    }

    return NextResponse.json(task)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Task PATCH API Error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}