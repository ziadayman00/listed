import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { adminLoginSchema } from '@/lib/validations/admin'
import { emailService } from '@/lib/services/email'

export async function POST(request) {
  try {
    console.log('🔐 Admin login attempt')
    
    const body = await request.json()
    
    // Validate input using Zod
    const validationResult = adminLoginSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors)
      const firstError = validationResult.error.errors[0]
      return NextResponse.json({ 
        error: firstError.message,
        field: firstError.path[0]
      }, { status: 400 })
    }

    const { email, password } = validationResult.data

    console.log('👤 Looking up admin user:', email)

    // First, try to find existing admin user
    let adminUser = await prisma.adminUser.findUnique({
      where: { 
        email: email.toLowerCase().trim(),
        isActive: true 
      }
    })

    // Define the admin password (should be in environment variable in production)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

    if (adminUser) {
      // Existing admin user - verify password
      const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash)
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for existing admin')
        return NextResponse.json({ 
          error: 'Invalid credentials' 
        }, { status: 401 })
      }
      
      console.log('✅ Existing admin user authenticated')
    } else {
      // No admin user found - check if password matches admin password
      if (password !== ADMIN_PASSWORD) {
        console.log('❌ Invalid admin password for new user')
        return NextResponse.json({ 
          error: 'Invalid admin credentials' 
        }, { status: 401 })
      }

      console.log('✅ Correct admin password - creating new admin user')
      
      // Create new admin user (not main admin)
      const hashedPassword = await bcrypt.hash(password, 12)
      
      adminUser = await prisma.adminUser.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          isMainAdmin: false, // Regular admin, not main admin
          isActive: true,
          isEmailVerified: false // Will be verified via email code
        }
      })
      
      console.log('✅ New admin user created:', adminUser.email)
    }

    console.log('✅ Password verified, generating verification code')

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save verification code
    await prisma.adminVerificationCode.create({
      data: {
        code: verificationCode,
        email: adminUser.email,
        type: 'LOGIN',
        expiresAt,
        adminUserId: adminUser.id
      }
    })

    // Send OTP email
    try {
      await emailService.sendOtpEmail(adminUser.email, verificationCode)
      console.log(`📧 OTP email sent to ${adminUser.email}`)
    } catch (emailError) {
      console.error('📧 Failed to send OTP email:', emailError)
      // Continue anyway - the code is still valid
    }
    
    // Prepare response
    const responseData = {
      success: true,
      message: 'OTP sent to your email address',
      requiresVerification: true,
      email: adminUser.email
    }

    // Only include code in development for testing
    if (process.env.NODE_ENV === 'development') {
      responseData.devCode = verificationCode
    }

    console.log('✅ Login step 1 completed, verification code generated')
    
    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('❌ Admin login error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
