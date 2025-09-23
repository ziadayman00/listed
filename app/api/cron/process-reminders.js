// api/cron/process-reminders.js - Process pending reminders
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTaskReminder } from '@/lib/task-reminders'

export async function GET(request) {
  // Verify request is from authorized source (add authentication)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const processedCount = { sent: 0, failed: 0, cancelled: 0 }

    console.log(`Processing reminders at ${now.toISOString()}`)

    // Get all pending reminders that are due
    const dueReminders = await prisma.reminderQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        task: {
          include: {
            deletedTask: true // To check if task is soft deleted
          }
        },
        user: true
      },
      take: 100 // Process in batches of 100
    })

    console.log(`Found ${dueReminders.length} due reminders`)

    for (const reminder of dueReminders) {
      try {
        // Skip if task is deleted or completed
        if (reminder.task.deletedTask || reminder.task.status === 'COMPLETED') {
          await prisma.reminderQueue.update({
            where: { id: reminder.id },
            data: { 
              status: 'CANCELLED',
              lastAttempt: now,
              errorMessage: 'Task deleted or completed'
            }
          })
          processedCount.cancelled++
          continue
        }

        // Skip if user doesn't exist
        if (!reminder.user) {
          await prisma.reminderQueue.update({
            where: { id: reminder.id },
            data: { 
              status: 'FAILED',
              lastAttempt: now,
              errorMessage: 'User not found',
              attempts: reminder.attempts + 1
            }
          })
          processedCount.failed++
          continue
        }

        // Send the reminder email
        console.log(`Sending ${reminder.type} reminder for task "${reminder.task.title}" to ${reminder.user.email}`)
        
        await sendTaskReminder(
          reminder.task, 
          reminder.user, 
          reminder.type
        )

        // Mark as sent
        await prisma.reminderQueue.update({
          where: { id: reminder.id },
          data: { 
            status: 'SENT',
            lastAttempt: now,
            attempts: reminder.attempts + 1
          }
        })

        processedCount.sent++
        console.log(`✅ Reminder sent successfully for task ${reminder.task.id}`)

      } catch (error) {
        console.error(`❌ Failed to send reminder ${reminder.id}:`, error)

        const maxAttempts = 3
        const newAttempts = reminder.attempts + 1
        const status = newAttempts >= maxAttempts ? 'FAILED' : 'PENDING'

        // Update reminder with error info
        await prisma.reminderQueue.update({
          where: { id: reminder.id },
          data: {
            status,
            lastAttempt: now,
            attempts: newAttempts,
            errorMessage: error.message
          }
        })

        processedCount.failed++
      }
    }

    // Clean up old completed/failed reminders (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const cleanupResult = await prisma.reminderQueue.deleteMany({
      where: {
        status: {
          in: ['SENT', 'FAILED', 'CANCELLED']
        },
        lastAttempt: {
          lt: thirtyDaysAgo
        }
      }
    })

    console.log(`Cleaned up ${cleanupResult.count} old reminder records`)

    const result = {
      success: true,
      timestamp: now.toISOString(),
      processedCount,
      cleanedUp: cleanupResult.count
    }

    console.log('Reminder processing completed:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in reminder processing cron job:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request) {
  // Allow POST for testing purposes
  return GET(request)
}