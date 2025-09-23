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

    return NextResponse.json(deletedTasks)

  } catch (error) {
    console.error('Deleted Tasks GET API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deleted tasks' },
      { status: 500 }
    )
  }
}
