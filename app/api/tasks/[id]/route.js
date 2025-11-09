// FIXED /api/tasks/[id]/route.js 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Enhanced validation schema for updates
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const updateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().nullable().optional(),
  dueDateDay: z.string().regex(dateRegex, 'Invalid date format, expected YYYY-MM-DD').nullable().optional(),
  dueTime: z.string().regex(timeRegex, 'Invalid time format, expected HH:mm').nullable().optional(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
  category: z.string().nullable().optional(),
  estimatedTime: z.number().positive('Estimated time must be a positive number').nullable().optional(),
  reminders: z.object({
    enabled: z.boolean(),
    time: z.enum(['30min', '1hour', '1day', '1week'])
  }).nullable().optional()
}).refine((data) => {
  if (data?.dueTime && !data?.dueDateDay && !data?.dueDate) return false
  return true
}, { message: 'A date (dueDateDay or dueDate) is required when providing a time', path: ['dueTime'] })

// FIXED: buildDueDateAndFlag function for PATCH operations
function buildDueDateAndFlag(input, existing) {
  // Returns { dueDate: Date|null|undefined, hasDueTime: boolean|undefined, dueDateDay: string|null|undefined }
  const hasProvidedAny = ('dueDate' in input) || ('dueDateDay' in input) || ('dueTime' in input)
  if (!hasProvidedAny) {
    return { dueDate: undefined, hasDueTime: undefined, dueDateDay: undefined }
  }

  // Handle backward-compatible full ISO string
  if (input.dueDate !== undefined) {
    if (input.dueDate === null) {
      return { dueDate: null, hasDueTime: false, dueDateDay: null }
    }
    
    const date = new Date(input.dueDate)
    const hasDueTime = !/T00:00:00/.test(input.dueDate)
    
    // Extract date part for dueDateDay
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dueDateDay = `${year}-${month}-${day}`
    
    return { 
      dueDate: hasDueTime ? date : null, 
      hasDueTime, 
      dueDateDay 
    }
  }

  // Handle separate dueDateDay and dueTime fields
  let dueDateDay = input.dueDateDay
  
  if (dueDateDay === null) {
    return { dueDate: null, hasDueTime: false, dueDateDay: null }
  }
  
  if (dueDateDay === undefined) {
    // Try to get from existing task
    dueDateDay = existing?.dueDateDay || (existing?.dueDate ? 
      existing.dueDate.toISOString().slice(0, 10) : undefined)
  }
  
  if (!dueDateDay) {
    return { dueDate: undefined, hasDueTime: undefined, dueDateDay: undefined }
  }

  // Handle time component
  let hasDueTime = false
  let hours = 0, minutes = 0

  if ('dueTime' in input) {
    if (input.dueTime === null) {
      // Explicitly removing time
      hasDueTime = false
    } else if (input.dueTime) {
      // Setting new time
      const [hh, mm] = input.dueTime.split(':').map(n => parseInt(n, 10))
      hours = hh
      minutes = mm
      hasDueTime = true
    }
  } else if (existing?.hasDueTime && existing?.dueDate) {
    // Preserve existing time if not explicitly changed
    hours = existing.dueDate.getHours()
    minutes = existing.dueDate.getMinutes()
    hasDueTime = true
  }

  const [y, m, d] = dueDateDay.split('-').map(n => parseInt(n, 10))
  const date = hasDueTime ? new Date(y, m - 1, d, hours, minutes, 0, 0) : null

  return { 
    dueDate: date, 
    hasDueTime, 
    dueDateDay 
  }
}

// PATCH /api/tasks/[id] - Fixed update handling
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
      updatedAt: new Date()
    }

    // Handle basic fields
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title.trim()
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description?.trim() || null
    }
    if (validatedData.category !== undefined) {
      updateData.category = validatedData.category?.trim() || null
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags
    }
    if (validatedData.estimatedTime !== undefined) {
      updateData.estimatedTime = validatedData.estimatedTime
    }
    if (validatedData.reminders !== undefined) {
      updateData.reminders = validatedData.reminders
    }

    // FIXED: Handle due date fields
    const { dueDate, hasDueTime, dueDateDay } = buildDueDateAndFlag(validatedData, existingTask)
    
    if (dueDate !== undefined) updateData.dueDate = dueDate
    if (hasDueTime !== undefined) updateData.hasDueTime = hasDueTime
    if (dueDateDay !== undefined) updateData.dueDateDay = dueDateDay

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

    // FIXED: Format task for client response
    const formattedTask = {
      ...task,
      dueDate: task.hasDueTime ? task.dueDate?.toISOString() : task.dueDateDay,
      dueDateDay: task.dueDateDay,
      hasDueTime: task.hasDueTime
    }

    return NextResponse.json(formattedTask)

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

// FIXED DELETE method - Proper soft delete without breaking relationship
export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params

    // Get complete task data for preservation
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: session.user.id,
        deletedTask: null // ✅ Only get tasks that aren't already deleted
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or already deleted' }, { status: 404 })
    }

    // ✅ FIX: Create deleted task record with the relationship in ONE transaction
    await prisma.deletedTask.create({
      data: {
        originalTaskId: existingTask.id,
        userId: existingTask.userId,
        title: existingTask.title,
        description: existingTask.description,
        status: existingTask.status,
        priority: existingTask.priority,
        dueDate: existingTask.dueDate,
        dueDateDay: existingTask.dueDateDay,
        hasDueTime: existingTask.hasDueTime,
        isAIGenerated: existingTask.isAIGenerated,
        tags: existingTask.tags,
        category: existingTask.category,
        estimatedTime: existingTask.estimatedTime,
        reminders: existingTask.reminders,
        originalCreatedAt: existingTask.createdAt,
        originalUpdatedAt: existingTask.updatedAt,
        originalCompletedAt: existingTask.completedAt
      }
    })

    // ✅ The relationship is automatically created by Prisma!
    // No need for separate update - the one-to-one relation handles it

    // Log activity
    try {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          type: 'TASK_DELETED',
          description: `Moved task to trash: ${existingTask.title}`,
          metadata: {
            taskId: existingTask.id,
            taskTitle: existingTask.title
          }
        }
      })
    } catch (activityError) {
      console.error('Error logging task soft deletion activity:', activityError)
    }

    return NextResponse.json({ message: 'Task moved to trash successfully' })

  } catch (error) {
    console.error('Task SOFT DELETE API Error:', error)
    return NextResponse.json(
      { error: 'Failed to move task to trash' },
      { status: 500 }
    )
  }
}