const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simple seed...')

  // Get existing users
  const users = await prisma.user.findMany()
  console.log(`👤 Found ${users.length} existing users`)

  if (users.length === 0) {
    console.log('❌ No users found. Please log in first to create a user.')
    return
  }

  const userId = users[0].id // Use the first user

  // Add some contact messages
  console.log('📧 Adding contact messages...')
  await prisma.contactMessage.createMany({
    data: [
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        message: 'I love the new AI features! When will dark mode be available?',
        status: 'NEW',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        name: 'David Brown',
        email: 'david.brown@example.com',
        message: 'Having trouble syncing tasks between devices. Can you help?',
        status: 'NEW',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      }
    ],
    skipDuplicates: true
  })

  // Add some support tickets
  console.log('🎫 Adding support tickets...')
  const ticket1 = await prisma.supportTicket.create({
    data: {
      subject: 'Unable to sync tasks across devices',
      description: 'My tasks are not syncing properly between my phone and laptop.',
      status: 'OPEN',
      priority: 'HIGH',
      userId: userId,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    }
  })

  const ticket2 = await prisma.supportTicket.create({
    data: {
      subject: 'Feature request: Dark mode',
      description: 'Would love to see a dark mode option in the app settings.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      userId: userId,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  })

  // Add messages for tickets
  await prisma.supportMessage.createMany({
    data: [
      {
        content: ticket1.description,
        isFromUser: true,
        ticketId: ticket1.id,
        createdAt: ticket1.createdAt
      },
      {
        content: ticket2.description,
        isFromUser: true,
        ticketId: ticket2.id,
        createdAt: ticket2.createdAt
      }
    ]
  })

  // Add some tasks
  console.log('📝 Adding tasks...')
  await prisma.task.createMany({
    data: [
      {
        title: 'Review quarterly reports',
        description: 'Go through all Q4 reports and prepare summary',
        status: 'COMPLETED',
        priority: 'HIGH',
        userId: userId,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        title: 'Prepare presentation for client meeting',
        description: 'Create slides for the upcoming client presentation',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        userId: userId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        title: 'Update project documentation',
        description: 'Update all project docs with latest changes',
        status: 'PENDING',
        priority: 'LOW',
        userId: userId,
        isAIGenerated: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ],
    skipDuplicates: true
  })

  console.log('🎉 Simple seed completed successfully!')
  
  // Show final counts
  const counts = {
    users: await prisma.user.count(),
    contacts: await prisma.contactMessage.count(),
    tickets: await prisma.supportTicket.count(),
    tasks: await prisma.task.count()
  }
  
  console.log('📊 Final counts:', counts)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
