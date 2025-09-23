# 📧 Gmail Email Setup Guide

This guide will help you configure Gmail to send OTP emails for the Listed admin authentication system.

## 🚀 Quick Setup

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup process to enable 2FA

### Step 2: Generate App Password
1. After enabling 2FA, go back to **Security** settings
2. Under "Signing in to Google", click **App passwords**
3. Select app: **Mail**
4. Select device: **Other (custom name)**
5. Enter name: **Listed Admin App**
6. Click **Generate**
7. **Copy the 16-character password** (you'll need this!)

### Step 3: Add Environment Variables
Add these to your `.env.local` file:

```bash
# Gmail Configuration for Admin OTP
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Example:**
```bash
GMAIL_USER=zyadd.aymann@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

## 🔧 Alternative Email Services

If you prefer not to use Gmail, here are other popular options:

### 1. **SendGrid** (Recommended for production)
```bash
npm install @sendgrid/mail
```
- Free tier: 100 emails/day
- Easy setup with API key
- Great deliverability

### 2. **AWS SES** (Amazon Simple Email Service)
```bash
npm install aws-sdk
```
- Very cheap ($0.10 per 1,000 emails)
- Requires AWS account
- Great for high volume

### 3. **Mailgun**
```bash
npm install mailgun-js
```
- Free tier: 5,000 emails/month
- Simple API
- Good documentation

### 4. **Resend** (Modern alternative)
```bash
npm install resend
```
- Developer-friendly
- Great React email templates
- Good free tier

## 🛠️ Testing the Setup

### Development Mode
In development, emails are logged to the console. You'll see:
```
📧 Email would be sent:
To: user@example.com
Subject: Listed Admin - Login Verification Code
Message: [OTP content]
```

### Production Mode
To test real email sending:

1. Set `NODE_ENV=production` in your `.env.local`
2. Add your Gmail credentials
3. Try logging in to the admin panel
4. Check your email for the OTP

## 🔍 Troubleshooting

### Common Issues:

**1. "Invalid login" error**
- Make sure you're using the **App Password**, not your regular Gmail password
- Ensure 2-Factor Authentication is enabled

**2. "Less secure app access" error**
- This is outdated. Use **App Passwords** instead
- Never enable "Less secure app access"

**3. Emails not being sent**
- Check your Gmail credentials in `.env.local`
- Verify the App Password is correct (16 characters)
- Check the console logs for error messages

**4. Emails going to spam**
- This is normal for new sending domains
- Add your sending email to your contacts
- In production, consider using a dedicated email service

## 🔒 Security Best Practices

1. **Never commit credentials to Git**
   - Add `.env.local` to `.gitignore`
   - Use environment variables in production

2. **Use App Passwords, not regular passwords**
   - More secure than regular passwords
   - Can be revoked independently

3. **Consider dedicated email services for production**
   - Better deliverability
   - Professional appearance
   - Better analytics and monitoring

## 📝 Email Template Features

The current email template includes:
- ✅ Professional HTML design
- ✅ Responsive layout
- ✅ Security warnings
- ✅ Expiration time (10 minutes)
- ✅ Branded with your app colors
- ✅ Both HTML and text versions

## 🚀 Production Recommendations

For production use, consider:

1. **Use a professional email service** (SendGrid, AWS SES, etc.)
2. **Set up SPF, DKIM, and DMARC** records for better deliverability
3. **Use a dedicated sending domain** (e.g., `noreply@yourdomain.com`)
4. **Monitor email delivery rates** and bounces
5. **Implement rate limiting** to prevent abuse

## 📞 Need Help?

If you encounter issues:
1. Check the console logs for error messages
2. Verify your Gmail App Password is correct
3. Ensure 2FA is enabled on your Google account
4. Test with a simple email first

Happy coding! 🎉
