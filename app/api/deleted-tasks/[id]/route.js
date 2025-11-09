import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/deleted-tasks/[id] - Permanently delete a task
export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params

    // Find the deleted task
    const deletedTask = await prisma.deletedTask.findUnique({
      where: { id }
    })

    if (!deletedTask) {
      return NextResponse.json({ 
        error: 'Task not found in trash' 
      }, { status: 404 })
    }

    if (deletedTask.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized to delete this task' 
      }, { status: 403 })
    }

    // ✅ FIX: Delete both Task and DeletedTask in correct order using transaction
    await prisma.$transaction(async (tx) => {
      // 1. First delete the original Task (this removes the relationship)
      await tx.task.delete({
        where: { id: deletedTask.originalTaskId }
      })

      // 2. Then delete the DeletedTask record
      await tx.deletedTask.delete({
        where: { id }
      })
    })

    // Log activity
    try {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          type: 'TASK_DELETED',
          description: `Permanently deleted task: ${deletedTask.title}`,
          metadata: {
            taskId: deletedTask.originalTaskId,
            taskTitle: deletedTask.title
          }
        }
      })
    } catch (activityError) {
      console.error('Error logging permanent task deletion activity:', activityError)
    }

    return NextResponse.json({ 
      message: 'Task permanently deleted successfully' 
    })

  } catch (error) {
    console.error('Permanent Delete Task API Error:', error)
    
    // More detailed error logging
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete: foreign key constraint failed',
        details: 'Task has related records that must be deleted first'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to permanently delete task',
      details: error.message 
    }, { status: 500 })
  }
}