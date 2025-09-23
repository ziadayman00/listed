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

    // ✅ Fix: Await params before accessing properties
    const params = await context.params
    let { id } = params
    
    // ✅ لو الـ id في Prisma من نوع Int
    // id = parseInt(id, 10)

    // Find the deleted task
    const deletedTask = await prisma.deletedTask.findUnique({
      where: { id }
    })

    if (!deletedTask) {
      console.warn(
        `Attempted to permanently delete DeletedTask with ID: ${id}, but not found.`
      )
      return NextResponse.json({ 
        message: 'Task already permanently deleted or not found.' 
      }, { status: 404 }) // ✅ Fix: Return 404 status for not found
    }

    if (deletedTask.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this task' }, { status: 403 })
    }

    // Try deleting the original task if it exists
    if (deletedTask.originalTaskId) {
      try {
        await prisma.task.delete({
          where: { id: deletedTask.originalTaskId }
        })
      } catch (prismaError) {
        // ✅ Fix: Check if it's a "not found" error specifically
        if (prismaError.code === 'P2025') {
          console.warn(
            `Original task with ID ${deletedTask.originalTaskId} not found during permanent deletion.`
          )
        } else {
          console.error('Error deleting original task:', prismaError)
          // Re-throw if it's not a "not found" error
          throw prismaError
        }
      }
    }

    // ✅ Fix: Add try-catch for the deletedTask deletion with specific error handling
    try {
      await prisma.deletedTask.delete({
        where: { id }
      })
    } catch (prismaError) {
      if (prismaError.code === 'P2025') {
        // Record was already deleted by another request
        console.warn(`DeletedTask with ID ${id} was already deleted.`)
        return NextResponse.json({ 
          message: 'Task was already permanently deleted.' 
        }, { status: 200 })
      } else {
        // Re-throw other errors
        throw prismaError
      }
    }

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

    return NextResponse.json({ message: 'Task permanently deleted' })
  } catch (error) {
    console.error('Permanent Delete Task API Error:', error)
    return NextResponse.json({ error: 'Failed to permanently delete task' }, { status: 500 })
  }
}