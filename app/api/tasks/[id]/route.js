// /api/tasks/[id]/route.js - Enhanced PATCH method
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
  // Backward-compatible full ISO date string
  dueDate: z.string().nullable().optional(),
  // New separate fields
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

function buildDueDateAndFlag(input, existing) {
  // Returns { dueDate: Date|null|undefined, hasDueTime: boolean|undefined }
  // undefined means not provided in update
  const hasProvidedAny = ('dueDate' in input) || ('dueDateDay' in input) || ('dueTime' in input)
  if (!hasProvidedAny) return { dueDate: undefined, hasDueTime: undefined }
  if (input.dueDate !== undefined && input.dueDate !== null) {
    return { dueDate: new Date(input.dueDate), hasDueTime: !/T00:00:00/.test(input.dueDate) }
  }
  if (input.dueDate === null) {
    return { dueDate: null, hasDueTime: false }
  }
  // If only day/time provided
  const baseDay = input.dueDateDay ?? (existing?.dueDate ? existing.dueDate.toISOString().slice(0,10) : undefined)
  if (!baseDay) return { dueDate: undefined, hasDueTime: undefined }
  const [y, m, d] = baseDay.split('-').map(n => parseInt(n, 10))
  let hours = 0, minutes = 0
  let hasDueTime = false
  if (input.dueTime !== undefined) {
    if (input.dueTime !== null) {
      const [hh, mm] = input.dueTime.split(':').map(n => parseInt(n, 10))
      hours = hh; minutes = mm; hasDueTime = true
    } else {
      hasDueTime = false
    }
  } else if (existing?.hasDueTime) {
    // preserve existing time
    const ex = new Date(existing.dueDate)
    hours = ex.getHours(); minutes = ex.getMinutes(); hasDueTime = true
  }
  const date = new Date(y, (m - 1), d, hours, minutes, 0, 0)
  return { dueDate: date, hasDueTime }
}

// PATCH /api/tasks/[id] - Enhanced update handling
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

    // Handle due date (support new separate fields)
    const built = buildDueDateAndFlag(validatedData, existingTask)
    if (built.dueDate !== undefined) updateData.dueDate = built.dueDate
    if (built.hasDueTime !== undefined) updateData.hasDueTime = built.hasDueTime

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

// DELETE method - Enhanced soft delete with complete data preservation
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
        deletedTask: null
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found or already deleted' }, { status: 404 })
    }

    // Create deleted task record with complete data
    const deletedTask = await prisma.deletedTask.create({
      data: {
        originalTaskId: existingTask.id,
        userId: existingTask.userId,
        title: existingTask.title,
        description: existingTask.description,
        status: existingTask.status,
        priority: existingTask.priority,
        dueDate: existingTask.dueDate,
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

    // Mark original task as soft deleted
    await prisma.task.update({
      where: { id: existingTask.id },
      data: {
        deletedTask: { connect: { id: deletedTask.id } }
      }
    })

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