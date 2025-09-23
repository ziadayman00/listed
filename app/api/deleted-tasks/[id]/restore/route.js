import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/deleted-tasks/[id]/restore - Restore a deleted task
export async function POST(request, context) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = context.params;
    console.log(`Attempting to restore deleted task with ID: ${id}`)

    // Find the deleted task
    const deletedTask = await prisma.deletedTask.findUnique({
      where: { id },
      include: { originalTask: true }
    })

    if (!deletedTask) {
      console.warn(`Deleted task with ID: ${id} not found.`)
      return NextResponse.json({ error: 'Deleted task not found' }, { status: 404 })
    }

    if (deletedTask.userId !== session.user.id) {
      console.warn(
        `Unauthorized restore attempt for task ID: ${id}. 
         User: ${session.user.id}, Task owner: ${deletedTask.userId}`
      )
      return NextResponse.json({ error: 'Unauthorized to restore this task' }, { status: 403 })
    }

    let restoredTask

    // Store originalTaskId before deleting DeletedTask entry
    const originalTaskIdToRestore = deletedTask.originalTaskId;

    // First, delete the DeletedTask entry. This resolves the relation violation.
    await prisma.deletedTask.delete({
      where: { id }
    });
    console.log(`DeletedTask entry with ID: ${id} removed.`);

    // Check if the original task still exists
    const originalTaskExists = await prisma.task.findUnique({
      where: { id: originalTaskIdToRestore }
    });

    if (originalTaskExists) {
      // If original task exists, update it to remove the deletedTask relation
      restoredTask = await prisma.task.update({
        where: { id: originalTaskIdToRestore },
        data: {
          title: deletedTask.title,
          description: deletedTask.description,
          userId: deletedTask.userId,
          // The 'deletedTask' relation is implicitly handled by deleting the DeletedTask record.
          // We can optionally explicitly set it to null if the relation field allows it directly
          // For a one-to-one @relation, deleting the child record automatically handles the parent side.
          // However, for explicit clarity, if Task had a `deletedTaskId String? @unique` field,
          // we'd set `deletedTaskId: null` here. Since it's a relation field, deleting the target suffices.
        }
      });
    } else {
      // If original task does not exist, create a new one from the deleted snapshot
      restoredTask = await prisma.task.create({
        data: {
          title: deletedTask.title,
          description: deletedTask.description,
          userId: deletedTask.userId
        }
      });
    }

    // Log activity
    try {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          type: 'TASK_UPDATED',
          description: `Restored task from trash: ${restoredTask.title}`,
          metadata: {
            taskId: restoredTask.id,
            taskTitle: restoredTask.title
          }
        }
      })
    } catch (activityError) {
      console.error('Error logging task restoration activity:', activityError)
    }

    return NextResponse.json(restoredTask)
  } catch (error) {
    console.error('Restore Deleted Task API Error:', error)
    return NextResponse.json({ error: 'Failed to restore task' }, { status: 500 })
  }
}
