const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create some test users (if they don't exist)
  const existingUsers = await prisma.user.count()
  console.log(`📊 Existing users: ${existingUsers}`)

  if (existingUsers === 0) {
    console.log('👤 Creating test users...')
    
    const testUsers = await Promise.all([
      prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          emailVerified: new Date(),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }),
      prisma.user.create({
        data: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          emailVerified: new Date(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      }),
      prisma.user.create({
        data: {
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      })
    ])

    console.log(`✅ Created ${testUsers.length} test users`)
  }

  // Get all users for creating related data
  const users = await prisma.user.findMany()
  
  // Create some test contact messages
  const existingContacts = await prisma.contactMessage.count()
  console.log(`📧 Existing contact messages: ${existingContacts}`)

  if (existingContacts === 0 && users.length > 0) {
    console.log('📧 Creating test contact messages...')
    
    const contactMessages = await Promise.all([
      prisma.contactMessage.create({
        data: {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          message: 'I love the new AI features! When will dark mode be available?',
          status: 'NEW',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
      }),
      prisma.contactMessage.create({
        data: {
          name: 'David Brown',
          email: 'david.brown@example.com',
          message: 'Having trouble syncing tasks between devices. Can you help?',
          status: 'NEW',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
        }
      }),
      prisma.contactMessage.create({
        data: {
          name: 'Emma Davis',
          email: 'emma.davis@example.com',
          message: 'Great app! Would love to see more customization options.',
          status: 'READ',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      })
    ])

    console.log(`✅ Created ${contactMessages.length} test contact messages`)
  }

  // Create some test support tickets
  const existingTickets = await prisma.supportTicket.count()
  console.log(`🎫 Existing support tickets: ${existingTickets}`)

  if (existingTickets === 0 && users.length > 0) {
    console.log('🎫 Creating test support tickets...')
    
    const supportTickets = await Promise.all([
      prisma.supportTicket.create({
        data: {
          subject: 'Unable to sync tasks across devices',
          description: 'My tasks are not syncing properly between my phone and laptop. I have tried logging out and back in but the issue persists.',
          status: 'OPEN',
          priority: 'HIGH',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
        }
      }),
      prisma.supportTicket.create({
        data: {
          subject: 'Feature request: Dark mode',
          description: 'Would love to see a dark mode option in the app settings. This would be great for night-time use.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      }),
      prisma.supportTicket.create({
        data: {
          subject: 'Billing question about premium features',
          description: 'I was charged twice this month for the premium subscription. Please check my account and process a refund.',
          status: 'RESOLVED',
          priority: 'URGENT',
          userId: users[2].id,
          resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        }
      })
    ])

    // Create initial messages for each ticket
    for (const ticket of supportTickets) {
      await prisma.supportMessage.create({
        data: {
          content: ticket.description,
          isFromUser: true,
          ticketId: ticket.id,
          createdAt: ticket.createdAt
        }
      })

      // Add a response for the resolved ticket
      if (ticket.status === 'RESOLVED') {
        await prisma.supportMessage.create({
          data: {
            content: 'We have processed your refund and you should see the credit in your account within 3-5 business days. Thank you for bringing this to our attention.',
            isFromUser: false,
            ticketId: ticket.id,
            createdAt: new Date(ticket.resolvedAt.getTime() - 30 * 60 * 1000) // 30 minutes before resolution
          }
        })
      }
    }

    console.log(`✅ Created ${supportTickets.length} test support tickets`)
  }

  // Create some test tasks
  const existingTasks = await prisma.task.count()
  console.log(`📝 Existing tasks: ${existingTasks}`)

  if (existingTasks === 0 && users.length > 0) {
    console.log('📝 Creating test tasks...')
    
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          title: 'Review quarterly reports',
          description: 'Go through all Q4 reports and prepare summary',
          status: 'COMPLETED',
          priority: 'HIGH',
          userId: users[0].id,
          completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      }),
      prisma.task.create({
        data: {
          title: 'Prepare presentation for client meeting',
          description: 'Create slides for the upcoming client presentation on Monday',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          userId: users[1].id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        }
      }),
      prisma.task.create({
        data: {
          title: 'Update project documentation',
          description: 'Update all project docs with latest changes',
          status: 'PENDING',
          priority: 'LOW',
          userId: users[Math.min(2, users.length - 1)].id,
          isAIGenerated: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      })
    ])

    console.log(`✅ Created ${tasks.length} test tasks`)
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
