import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { otpVerificationSchema } from '@/lib/validations/admin'

export async function POST(request) {
  try {
    console.log('🔐 Admin OTP verification attempt')
    
    const body = await request.json()
    
    // Validate input using Zod
    const validationResult = otpVerificationSchema.safeParse({
      email: body.email,
      otp: body.code || body.otp // Accept both 'code' and 'otp' for backwards compatibility
    })
    
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors)
      const firstError = validationResult.error.errors[0]
      return NextResponse.json({ 
        error: firstError.message,
        field: firstError.path[0]
      }, { status: 400 })
    }

    const { email, otp } = validationResult.data

    console.log('🔍 Looking up verification code for:', email)

    // Find valid verification code
    const verificationRecord = await prisma.adminVerificationCode.findFirst({
      where: {
        email: email,
        code: otp,
        type: 'LOGIN',
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        adminUser: true
      }
    })

    if (!verificationRecord || !verificationRecord.adminUser) {
      console.log('❌ Invalid or expired verification code')
      return NextResponse.json({ 
        error: 'Invalid or expired verification code' 
      }, { status: 401 })
    }

    const { adminUser } = verificationRecord

    // Check if admin user is still active
    if (!adminUser.isActive) {
      console.log('❌ Admin account is inactive')
      return NextResponse.json({ 
        error: 'Admin account is inactive' 
      }, { status: 401 })
    }

    console.log('✅ Verification code valid, marking as used')

    // Mark verification code as used
    await prisma.adminVerificationCode.update({
      where: { id: verificationRecord.id },
      data: { usedAt: new Date() }
    })

    // Update admin user last login
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { 
        lastLoginAt: new Date(),
        isEmailVerified: true 
      }
    })

    // Generate JWT token for admin session
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const adminToken = jwt.sign(
      {
        adminId: adminUser.id,
        email: adminUser.email,
        isMainAdmin: adminUser.isMainAdmin,
        type: 'admin'
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    console.log('✅ Admin login successful:', adminUser.email)

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        isMainAdmin: adminUser.isMainAdmin,
        lastLoginAt: adminUser.lastLoginAt
      }
    }, { status: 200 })

    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/' // Allow cookie to be sent to all paths
    })

    return response

  } catch (error) {
    console.error('❌ Admin verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
