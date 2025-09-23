const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding admin users...')

  try {
    // Hash the admin password
    const adminPassword = 'admin123' // You should change this!
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create main admin user
    const mainAdmin = await prisma.adminUser.upsert({
      where: { email: 'zyadd.aymann@gmail.com' },
      update: {
        passwordHash: hashedPassword,
        isMainAdmin: true,
        isActive: true,
        isEmailVerified: true
      },
      create: {
        email: 'zyadd.aymann@gmail.com',
        passwordHash: hashedPassword,
        isMainAdmin: true,
        isActive: true,
        isEmailVerified: true
      }
    })

    console.log('✅ Main admin user created/updated:')
    console.log(`   Email: ${mainAdmin.email}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   Main Admin: ${mainAdmin.isMainAdmin}`)
    console.log(`   ID: ${mainAdmin.id}`)

    // You can add more team admin users here
    // Example team admin user (uncomment and modify as needed):
    /*
    const teamAdmin = await prisma.adminUser.upsert({
      where: { email: 'team@listed.com' },
      update: {
        passwordHash: hashedPassword,
        isMainAdmin: false,
        isActive: true,
        isEmailVerified: true
      },
      create: {
        email: 'team@listed.com',
        passwordHash: hashedPassword,
        isMainAdmin: false,
        isActive: true,
        isEmailVerified: true
      }
    })

    console.log('✅ Team admin user created/updated:')
    console.log(`   Email: ${teamAdmin.email}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   Main Admin: ${teamAdmin.isMainAdmin}`)
    */

    console.log('🎉 Admin seeding completed!')
    console.log('')
    console.log('📝 IMPORTANT NOTES:')
    console.log('   1. Change the default password immediately!')
    console.log('   2. The main admin can access /admin with these credentials')
    console.log('   3. Team members can be added by creating more AdminUser records')
    console.log('   4. All admin users will need email verification on first login')
    console.log('')

  } catch (error) {
    console.error('❌ Error seeding admin users:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
