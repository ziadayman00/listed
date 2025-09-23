import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  // In a real application, you'd want to secure this endpoint
  // For example, by checking for a cron secret or IP whitelist
  const authHeader = request.headers.get('authorization');

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Find tasks to be permanently deleted
    const tasksToDelete = await prisma.deletedTask.findMany({
      where: {
        deletedAt: { lt: fifteenDaysAgo }
      }
    });

    const originalTaskIdsToDelete = tasksToDelete.map(dt => dt.originalTaskId);

    // Delete from DeletedTask table
    await prisma.deletedTask.deleteMany({
      where: {
        deletedAt: { lt: fifteenDaysAgo }
      }
    });

    // Also delete the original tasks (if they still exist and are linked)
    if (originalTaskIdsToDelete.length > 0) {
      await prisma.task.deleteMany({
        where: {
          id: { in: originalTaskIdsToDelete }
        }
      });
    }

    console.log(`Auto-cleanup: Deleted ${tasksToDelete.length} tasks older than 15 days.`);

    return NextResponse.json({ message: `Auto-cleanup completed. ${tasksToDelete.length} tasks deleted.` });

  } catch (error) {
    console.error('Auto-cleanup Cron Job Error:', error);
    return NextResponse.json(
      { error: 'Failed to run auto-cleanup' },
      { status: 500 }
    );
  }
}
