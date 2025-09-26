// COMPLETE FIX for /api/tasks/route.js

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { scheduleTaskReminder } from '@/lib/reminder-scheduler'

// Enhanced validation schema (keep existing)
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
  if (data?.dueTime && !data?.dueDateDay && !data?.dueDate) return false
  return true
}, { message: 'A date (dueDateDay or dueDate) is required when providing a time', path: ['dueTime'] })

// FIXED: buildDueDateAndFlag function
function buildDueDateAndFlag(input) {
  // Returns { dueDate: Date|null, hasDueTime: boolean, dueDateDay: string|null }
  if (input.dueDate) {
    // Backward compatible: client supplied full ISO string
    const date = new Date(input.dueDate);
    const hasDueTime = !!input.dueDate && !/T00:00:00/.test(input.dueDate);
    
    // Also extract the date part for storage
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dueDateDay = `${year}-${month}-${day}`;
    
    return { 
      dueDate: hasDueTime ? date : null, 
      hasDueTime, 
      dueDateDay 
    };
  }
  
  if (!input.dueDateDay) {
    return { dueDate: null, hasDueTime: false, dueDateDay: null };
  }
  
  const dueDateDay = input.dueDateDay;
  
  if (input.dueTime) {
    // Create a proper datetime for tasks with specific time
    const [hh, mm] = input.dueTime.split(':').map(v => parseInt(v, 10));
    const [y, m, d] = dueDateDay.split('-').map(v => parseInt(v, 10));
    
    // Create date in local timezone
    const date = new Date(y, m - 1, d, hh, mm, 0, 0);
    
    return { 
      dueDate: date, 
      hasDueTime: true, 
      dueDateDay 
    };
  } else {
    // Date-only task - store only the day string, no time
    return { 
      dueDate: null, 
      hasDueTime: false, 
      dueDateDay 
    };
  }
}

// FIXED: GET /api/tasks with proper date formatting
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

    const where = {
      userId: session.user.id,
      deletedTask: null,
      ...(status && { status: status.toUpperCase() }),
      ...(priority && { priority: priority.toUpperCase() }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
          { category: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const totalCount = await prisma.task.count({ where })

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { dueDateDay: 'asc' }, // Add ordering by date day too
        { createdAt: 'desc' }
      ],
      ...(limit && { take: limit }),
      ...(limit && { skip: (page - 1) * limit })
    })

    // FIXED: Format tasks for client with proper date handling
    const formattedTasks = tasks.map(task => ({
      ...task,
      // For client consumption: use dueDateDay for date-only tasks, dueDate for datetime tasks
      dueDate: task.hasDueTime ? task.dueDate?.toISOString() : task.dueDateDay,
      // Keep the raw fields for internal use
      dueDateDay: task.dueDateDay,
      hasDueTime: task.hasDueTime
    }))

    return NextResponse.json({
      tasks: formattedTasks,
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

// FIXED: POST /api/tasks with proper date storage
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // FIXED: Use new buildDueDateAndFlag function
    const { dueDate, hasDueTime, dueDateDay } = buildDueDateAndFlag(validatedData)
    
    const taskData = {
      title: validatedData.title.trim(),
      description: validatedData.description?.trim() || null,
      priority: validatedData.priority,
      status: validatedData.status,
      dueDate, // Will be null for date-only tasks, Date object for datetime tasks
      dueDateDay, // Always the YYYY-MM-DD string when date is provided
      hasDueTime,
      tags: validatedData.tags || [],
      category: validatedData.category?.trim() || null,
      estimatedTime: validatedData.estimatedTime || null,
      reminders: validatedData.reminders,
      userId: session.user.id,
      isAIGenerated: validatedData.isAIGenerated
    }

    const task = await prisma.task.create({
      data: taskData
    })

    // Schedule reminder if enabled
    try {
      await scheduleTaskReminder(task, session.user.id)
    } catch (reminderError) {
      console.error('Failed to schedule reminder:', reminderError)
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

    // FIXED: Return formatted task to client
    const formattedTask = {
      ...task,
      dueDate: task.hasDueTime ? task.dueDate?.toISOString() : task.dueDateDay,
      dueDateDay: task.dueDateDay,
      hasDueTime: task.hasDueTime
    }

    return NextResponse.json(formattedTask, { status: 201 })

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