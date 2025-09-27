import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/deleted-tasks - Get user's deleted tasks
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deletedTasks = await prisma.deletedTask.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        originalTask: true // Include original task data if needed
      },
      orderBy: {
        deletedAt: 'desc'
      }
    })

    // Flatten the response to make it easier to use in the frontend
    const formattedDeletedTasks = deletedTasks.map(deletedTask => ({
      id: deletedTask.id,
      title: deletedTask.title || deletedTask.originalTask?.title || 'Untitled Task',
      description: deletedTask.description || deletedTask.originalTask?.description || '',
      deletedAt: deletedTask.deletedAt,
      originalTaskId: deletedTask.originalTaskId,
      // Include any other fields you need
      ...deletedTask.originalTask // Spread original task data if needed
    }))

    return NextResponse.json(formattedDeletedTasks)

  } catch (error) {
    console.error('Deleted Tasks GET API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deleted tasks' },
      { status: 500 }
    )
  }
}