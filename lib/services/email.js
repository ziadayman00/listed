// Email service for sending OTP and notifications
// Updated to use Nodemailer with Gmail SMTP
import nodemailer from 'nodemailer'

export class EmailService {
  constructor() {
    // Use SEND_EMAILS environment variable to control email sending
    // Set SEND_EMAILS=true in .env.local to send real emails
    this.shouldSendEmails = process.env.SEND_EMAILS === 'true'
    
    // Initialize Gmail transporter
    this.transporter = null
    this.initializeTransporter()
  }

  /**
   * Initialize Nodemailer transporter for Gmail
   */
  initializeTransporter() {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      })
      console.log('✅ Gmail transporter initialized')
    } else {
      console.warn('⚠️ Gmail credentials not found. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local')
    }
  }

  /**
   * Send OTP email to admin user
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP code
   * @param {string} userName - User name (optional)
   */
  async sendOtpEmail(email, otp, userName = null) {
    const subject = 'Listed Admin - Login Verification Code'
    const textMessage = this.generateOtpEmailTemplate(otp, userName)
    const htmlMessage = this.generateOtpHtmlTemplate(otp, userName)

    return await this.sendEmail(email, subject, textMessage, htmlMessage)
  }

  /**
   * Send welcome email to new admin user
   * @param {string} email - Recipient email
   * @param {string} userName - User name
   */
  async sendWelcomeEmail(email, userName) {
    const subject = 'Welcome to Listed Admin Panel'
    const message = this.generateWelcomeEmailTemplate(userName)

    return await this.sendEmail(email, subject, message)
  }

  /**
   * Generate OTP email template
   * @param {string} otp - 6-digit OTP code
   * @param {string} userName - User name (optional)
   */
  generateOtpEmailTemplate(otp, userName = null) {
    const greeting = userName ? `Hi ${userName}` : 'Hello'
    
    return `
${greeting},

You requested to sign in to the Listed Admin Panel.

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Listed Team

---
This is an automated message, please do not reply.
    `.trim()
  }

  /**
   * Generate welcome email template
   * @param {string} userName - User name
   */
  generateWelcomeEmailTemplate(userName) {
    return `
Hi ${userName},

Welcome to the Listed Admin Panel!

You now have admin access to manage the Listed platform. You can:
• View and manage users
• Handle contact messages
• Manage support tickets
• Access analytics and reports

To sign in, visit: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/login

If you have any questions, please don't hesitate to reach out.

Best regards,
Listed Team

---
This is an automated message, please do not reply.
    `.trim()
  }

  /**
   * Generate HTML email template for OTP
   * @param {string} otp - 6-digit OTP code
   * @param {string} userName - User name (optional)
   */
  generateOtpHtmlTemplate(otp, userName = null) {
    const greeting = userName ? `Hi ${userName}` : 'Hello'
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #784e87, #9d6ba8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .otp-code { background: #784e87; color: white; padding: 20px 30px; font-size: 28px; font-weight: bold; text-align: center; border-radius: 8px; margin: 25px 0; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .logo { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 Listed</div>
          <h1>Admin Panel Verification</h1>
          <p>Secure login verification required</p>
        </div>
        <div class="content">
          <h2>${greeting}!</h2>
          <p>You requested to sign in to the <strong>Listed Admin Panel</strong>.</p>
          
          <p>Your verification code is:</p>
          <div class="otp-code">${otp}</div>
          
          <div class="warning">
            <p><strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong>.</p>
            <p><strong>🔒 Security:</strong> Never share this code with anyone.</p>
          </div>
          
          <p>If you didn't request this code, please ignore this email and ensure your account is secure.</p>
          
          <p>Best regards,<br/>
          <strong>The Listed Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Listed. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  /**
   * Send email using Gmail SMTP via Nodemailer
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} message - Email message (text)
   * @param {string} html - Email message (HTML, optional)
   */
  async sendEmail(to, subject, message, html = null) {
    try {
      if (!this.shouldSendEmails) {
        // In development mode or when SEND_EMAILS is not set to true, just log the email
        console.log('📧 Email would be sent (set SEND_EMAILS=true in .env.local to send real emails):')
        console.log('To:', to)
        console.log('Subject:', subject)
        console.log('Message:', message)
        console.log('---')
        return { success: true, provider: 'development-console' }
      }

      // Check if transporter is available
      if (!this.transporter) {
        console.warn('📧 Gmail transporter not available. Check your credentials.')
        console.log(`📧 Fallback - Email for ${to}:`)
        console.log(`Subject: ${subject}`)
        console.log(`Message: ${message}`)
        return { success: false, error: 'Gmail transporter not configured' }
      }

      // Send email via Gmail
      const mailOptions = {
        from: `"Listed Admin" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        text: message,
        html: html || message.replace(/\n/g, '<br>')
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      console.log('✅ Email sent successfully!')
      console.log('📧 Message ID:', info.messageId)
      
      return { success: true, provider: 'gmail', messageId: info.messageId }

    } catch (error) {
      console.error('❌ Email sending failed:', error.message)
      console.log(`📧 Fallback - Email for ${to}:`)
      console.log(`Subject: ${subject}`)
      console.log(`Message: ${message}`)
      
      return { success: false, error: error.message }
    }
  }

  /**
   * Validate email configuration
   */
  validateConfiguration() {
    // Check if required environment variables are set
    const requiredEnvVars = [
      // Add your email service environment variables here
      // 'SENDGRID_API_KEY',
      // 'SMTP_HOST',
      // 'SMTP_USER',
      // etc.
    ]

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing email configuration:', missing.join(', '))
      return false
    }

    return true
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Example integration with SendGrid (commented out)
/*
import sgMail from '@sendgrid/mail'

export class SendGridEmailService extends EmailService {
  constructor() {
    super()
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    }
  }

  async sendEmail(to, subject, message) {
    try {
      if (this.isDevelopment) {
        return super.sendEmail(to, subject, message)
      }

      const msg = {
        to,
        from: process.env.FROM_EMAIL || 'admin@listed.com',
        subject,
        text: message,
        html: message.replace(/\n/g, '<br>')
      }

      await sgMail.send(msg)
      return { success: true, provider: 'sendgrid' }

    } catch (error) {
      console.error('SendGrid email error:', error)
      return { success: false, error: error.message }
    }
  }
}
*/
