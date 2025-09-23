import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    console.log('📋 Fetching admin users')
    
    // Get admin token from cookies
    const adminToken = request.cookies.get('admin-token')?.value

    if (!adminToken) {
      console.log('❌ No admin token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    let decoded
    
    try {
      decoded = jwt.verify(adminToken, jwtSecret)
    } catch (jwtError) {
      console.log('❌ Invalid admin token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify current admin is main admin
    const currentAdmin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId }
    })

    if (!currentAdmin || !currentAdmin.isMainAdmin) {
      console.log('❌ Not main admin - access denied')
      return NextResponse.json({ 
        error: 'Access denied. Only main admin can manage admin users.' 
      }, { status: 403 })
    }

    // Fetch all admin users
    const adminUsers = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        isMainAdmin: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: [
        { isMainAdmin: 'desc' }, // Main admin first
        { createdAt: 'desc' }
      ]
    })

    console.log('✅ Admin users fetched:', adminUsers.length)
    return NextResponse.json({ adminUsers }, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching admin users:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    console.log('🗑️ Delete admin user request')
    
    // Get admin token from cookies
    const adminToken = request.cookies.get('admin-token')?.value

    if (!adminToken) {
      console.log('❌ No admin token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    let decoded
    
    try {
      decoded = jwt.verify(adminToken, jwtSecret)
    } catch (jwtError) {
      console.log('❌ Invalid admin token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify current admin is main admin
    const currentAdmin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId }
    })

    if (!currentAdmin || !currentAdmin.isMainAdmin) {
      console.log('❌ Not main admin - delete access denied')
      return NextResponse.json({ 
        error: 'Access denied. Only main admin can delete admin users.' 
      }, { status: 403 })
    }

    // Get admin ID to delete from request body
    const body = await request.json()
    const { adminId } = body

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Check if trying to delete self
    if (adminId === currentAdmin.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own admin account' 
      }, { status: 400 })
    }

    // Check if admin to delete exists and is not main admin
    const adminToDelete = await prisma.adminUser.findUnique({
      where: { id: adminId }
    })

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    if (adminToDelete.isMainAdmin) {
      return NextResponse.json({ 
        error: 'Cannot delete main admin account' 
      }, { status: 400 })
    }

    // Delete the admin user and their verification codes
    await prisma.adminUser.delete({
      where: { id: adminId }
    })

    console.log('✅ Admin user deleted:', adminToDelete.email)
    return NextResponse.json({ 
      success: true, 
      message: `Admin user ${adminToDelete.email} has been deleted` 
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error deleting admin user:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
