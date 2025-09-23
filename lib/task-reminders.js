// lib/task-reminders.js - Task reminder email service
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
const reminderEmailTemplate = (task, user, reminderType) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReminderMessage = () => {
    switch (reminderType) {
      case 'DUE_DATE':
        return `Your task "${task.title}" is due soon!`
      case 'OVERDUE':
        return `Your task "${task.title}" is overdue.`
      default:
        return `Reminder about your task: "${task.title}"`
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ef4444'
      case 'MEDIUM': return '#f59e0b'
      case 'LOW': return '#10b981'
      default: return '#6b7280'
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder - Listed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
        
        <!-- Header -->
        <div style="background-color: #784e87; padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">📋 Listed</h1>
          <p style="margin: 8px 0 0 0; color: #e5d3ff; font-size: 14px;">Task Reminder</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px;">
            Hi ${user.name?.split(' ')[0] || 'there'}! 👋
          </h2>
          
          <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
            ${getReminderMessage()}
          </p>
          
          <!-- Task Card -->
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px; background-color: #fafafa;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getPriorityColor(task.priority)}; margin-right: 8px;"></div>
              <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${task.title}</h3>
            </div>
            
            ${task.description ? `
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                ${task.description}
              </p>
            ` : ''}
            
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <span style="display: inline-flex; align-items: center; background-color: ${getPriorityColor(task.priority)}20; color: ${getPriorityColor(task.priority)}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                📍 ${task.priority} Priority
              </span>
              
              ${task.dueDate ? `
                <span style="display: inline-flex; align-items: center; background-color: #ddd6fe; color: #7c3aed; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                  📅 Due: ${formatDate(task.dueDate)}
                </span>
              ` : ''}
              
              ${task.category ? `
                <span style="display: inline-flex; align-items: center; background-color: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                  🏷️ ${task.category}
                </span>
              ` : ''}
            </div>
            
            ${task.tags && task.tags.length > 0 ? `
              <div style="margin-top: 12px;">
                ${task.tags.map(tag => `
                  <span style="display: inline-block; background-color: #784e87; color: white; padding: 2px 6px; border-radius: 8px; font-size: 11px; margin-right: 4px; margin-bottom: 4px;">
                    ${tag}
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
               style="display: inline-block; background-color: #784e87; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
              View Task in Listed
            </a>
          </div>
          
          <!-- Footer Message -->
          <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5;">
            Stay organized and get things done! 🎯
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
            You're receiving this because you enabled reminders for your tasks.
            <br>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings" style="color: #784e87; text-decoration: none;">
              Manage notification settings
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const sendTaskReminder = async (task, user, reminderType = 'DUE_DATE') => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Listed <noreply@yourdomain.com>', // Replace with your verified domain
      to: [user.email],
      subject: `📋 Task Reminder: ${task.title}`,
      html: reminderEmailTemplate(task, user, reminderType),
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }

  } catch (error) {
    console.error('Error sending task reminder:', error)
    throw error
  }
}

export const sendDailyTaskSummary = async (user, tasks) => {
  try {
    const dueTodayTasks = tasks.filter(task => {
      if (!task.dueDate) return false
      const today = new Date()
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === today.toDateString()
    })

    if (dueTodayTasks.length === 0) return { success: true, skipped: true }

    const summaryHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Task Summary - Listed</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <div style="background-color: #784e87; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">📋 Your Daily Summary</h1>
            <p style="margin: 8px 0 0 0; color: #e5d3ff; font-size: 14px;">
              ${dueTodayTasks.length} task${dueTodayTasks.length !== 1 ? 's' : ''} due today
            </p>
          </div>
          
          <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937;">Hi ${user.name?.split(' ')[0] || 'there'}! 🌅</h2>
            
            ${dueTodayTasks.map(task => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${task.title}</h3>
                ${task.description ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${task.description}</p>` : ''}
                <span style="background-color: #784e87; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                  ${task.priority} Priority
                </span>
              </div>
            `).join('')}
            
            <div style="text-align: center; margin-top: 24px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                 style="display: inline-block; background-color: #784e87; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
                Open Listed
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'Listed <noreply@yourdomain.com>',
      to: [user.email],
      subject: `📋 Daily Summary: ${dueTodayTasks.length} task${dueTodayTasks.length !== 1 ? 's' : ''} due today`,
      html: summaryHTML,
    })

    if (error) {
      throw new Error(`Failed to send daily summary: ${error.message}`)
    }

    return { success: true, data }

  } catch (error) {
    console.error('Error sending daily summary:', error)
    throw error
  }
}