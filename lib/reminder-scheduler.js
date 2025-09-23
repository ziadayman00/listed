// lib/reminder-scheduler.js - Reminder scheduling service
import { prisma } from '@/lib/prisma'

export const calculateReminderTime = (dueDate, reminderTime) => {
  if (!dueDate) return null
  
  const due = new Date(dueDate)
  const reminderDate = new Date(due)
  
  switch (reminderTime) {
    case '30min':
      reminderDate.setMinutes(due.getMinutes() - 30)
      break
    case '1hour':
      reminderDate.setHours(due.getHours() - 1)
      break
    case '1day':
      reminderDate.setDate(due.getDate() - 1)
      break
    case '1week':
      reminderDate.setDate(due.getDate() - 7)
      break
    default:
      return null
  }
  
  // Don't schedule reminders in the past
  if (reminderDate < new Date()) {
    return null
  }
  
  return reminderDate
}

export const scheduleTaskReminder = async (task, userId) => {
  try {
    // Remove any existing reminders for this task
    await prisma.reminderQueue.deleteMany({
      where: {
        taskId: task.id,
        userId: userId
      }
    })

    // Only schedule if reminders are enabled and task has due date
    if (!task.reminders?.enabled || !task.dueDate) {
      console.log(`No reminder scheduled for task ${task.id}: reminders disabled or no due date`)
      return { success: true, scheduled: false }
    }

    const reminderTime = calculateReminderTime(task.dueDate, task.reminders.time)
    
    if (!reminderTime) {
      console.log(`No reminder scheduled for task ${task.id}: calculated time is in the past`)
      return { success: true, scheduled: false }
    }

    // Create reminder entry
    const reminder = await prisma.reminderQueue.create({
      data: {
        taskId: task.id,
        userId: userId,
        type: 'DUE_DATE',
        scheduledFor: reminderTime
      }
    })

    console.log(`Reminder scheduled for task ${task.id} at ${reminderTime}`)
    return { success: true, scheduled: true, reminder }

  } catch (error) {
    console.error('Error scheduling task reminder:', error)
    throw error
  }
}

export const scheduleOverdueReminder = async (taskId, userId) => {
  try {
    // Schedule overdue reminder for 1 hour after due date
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || !task.dueDate || task.status === 'COMPLETED') {
      return { success: true, scheduled: false }
    }

    const overdueTime = new Date(task.dueDate)
    overdueTime.setHours(overdueTime.getHours() + 1)

    // Don't schedule if already past overdue time
    if (overdueTime < new Date()) {
      return { success: true, scheduled: false }
    }

    const reminder = await prisma.reminderQueue.create({
      data: {
        taskId: taskId,
        userId: userId,
        type: 'OVERDUE',
        scheduledFor: overdueTime
      }
    })

    return { success: true, scheduled: true, reminder }

  } catch (error) {
    console.error('Error scheduling overdue reminder:', error)
    throw error
  }
}

export const cancelTaskReminders = async (taskId) => {
  try {
    await prisma.reminderQueue.updateMany({
      where: {
        taskId: taskId,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    })

    return { success: true }

  } catch (error) {
    console.error('Error cancelling task reminders:', error)
    throw error
  }
}

export const rescheduleTaskReminders = async (task, userId) => {
  try {
    // Cancel existing reminders
    await cancelTaskReminders(task.id)
    
    // Schedule new reminders
    const result = await scheduleTaskReminder(task, userId)
    
    return result

  } catch (error) {
    console.error('Error rescheduling task reminders:', error)
    throw error
  }
}