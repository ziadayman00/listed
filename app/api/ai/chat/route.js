// // /api/ai/chat/route.js
// /api/ai/chat/route.js - Using GitHub Models
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference"
import { AzureKeyCredential } from "@azure/core-auth"

const SYSTEM_PROMPT = `You are a helpful AI assistant that helps users create and organize tasks. When users describe what they need to do, analyze their message and:

1. Provide a friendly, helpful response
2. If appropriate, suggest structured tasks based on their request

For task suggestions, follow these rules:
- Break down complex requests into smaller, actionable tasks
- Assign appropriate priorities (low, medium, high) based on urgency/importance
- Suggest relevant categories (Work, Personal, Health, Learning, Shopping, Other)
- Keep titles concise but descriptive
- Provide helpful descriptions that clarify what needs to be done
- Only suggest tasks when the user's message clearly indicates work that needs to be done

If suggesting tasks, format your response as JSON with this structure:
{
  "response": "Your helpful text response to the user",
  "tasks": [
    {
      "title": "Task title (max 100 chars)",
      "description": "Task description (max 500 chars)",
      "priority": "low|medium|high",
      "category": "Work|Personal|Health|Learning|Shopping|Other",
      "estimatedTime": 30
    }
  ]
}

If not suggesting tasks, just respond with:
{
  "response": "Your helpful text response",
  "tasks": []
}

Guidelines:
- Keep responses conversational and encouraging
- Don't create tasks for vague requests like "help me" without specific context
- Maximum 5 tasks per request
- Focus on actionable, specific tasks
- Consider the user's context and needs`

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Initialize GitHub Models client
    const token = process.env.GITHUB_TOKEN
    const endpoint = "https://models.inference.ai.azure.com"
    const model = "gpt-4o-mini" // Free model

    if (!token) {
      throw new Error('GITHUB_TOKEN not configured')
    }

    const client = ModelClient(endpoint, new AzureKeyCredential(token))

    // Call GitHub Models API
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1500,
        model: model
      }
    })

    if (isUnexpected(response)) {
      throw new Error(`AI API Error: ${response.body?.error?.message || 'Unknown error'}`)
    }

    const aiResponse = response.body?.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI model')
    }

    let parsedResponse
    try {
      // Try to parse as JSON first
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      // If not valid JSON, treat as plain text response
      parsedResponse = {
        response: aiResponse,
        tasks: []
      }
    }

    // Validate the parsed response structure
    if (!parsedResponse.response) {
      parsedResponse.response = aiResponse
    }
    if (!Array.isArray(parsedResponse.tasks)) {
      parsedResponse.tasks = []
    }

    // Validate and clean task data
    const validTasks = parsedResponse.tasks
      .slice(0, 5) // Maximum 5 tasks
      .map(task => {
        // Validate required fields
        if (!task.title || typeof task.title !== 'string') return null
        
        const cleanTask = {
          title: task.title.slice(0, 100).trim(),
          description: (task.description || '').slice(0, 500).trim(),
          priority: ['low', 'medium', 'high'].includes(task.priority?.toLowerCase()) 
            ? task.priority.toLowerCase() 
            : 'medium',
          category: ['Work', 'Personal', 'Health', 'Learning', 'Shopping', 'Other'].includes(task.category)
            ? task.category
            : 'Personal',
          estimatedTime: typeof task.estimatedTime === 'number' && task.estimatedTime > 0
            ? Math.min(task.estimatedTime, 9999)
            : null
        }
        
        return cleanTask.title ? cleanTask : null
      })
      .filter(Boolean)

    // Log the AI interaction
    try {
      await prisma.aILog.create({
        data: {
          userId: session.user.id,
          action: validTasks.length > 0 ? 'TASK_SUGGESTED' : 'TASK_ANALYZED',
          prompt: message,
          response: parsedResponse.response,
          metadata: {
            model: 'gpt-4o-mini',
            provider: 'github-models',
            tokensUsed: response.body?.usage?.total_tokens || 0,
            tasksGenerated: validTasks.length,
            originalTasks: parsedResponse.tasks,
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log AI interaction:', logError)
      // Don't fail the request if logging fails
    }

    // Return response in the format expected by frontend
    return NextResponse.json({
      response: parsedResponse.response,
      tasks: validTasks
    })

  } catch (error) {
    console.error('GitHub Models AI Chat API Error:', error)

    // Log the error attempt
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        await prisma.aILog.create({
          data: {
            userId: session.user.id,
            action: 'TASK_ANALYZED',
            prompt: message || 'Unknown message',
            response: 'Error occurred during processing',
            metadata: {
              provider: 'github-models',
              error: error.message,
              timestamp: new Date().toISOString()
            }
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    // Return user-friendly error messages
    if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'AI service is temporarily busy. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error.message?.includes('GITHUB_TOKEN')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    )
  }
}




// /api/ai/chat/route.js - Mock Version for Development
// import { NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'

// // Mock responses based on keywords in user message
// const generateMockResponse = (message) => {
//   const lowerMessage = message.toLowerCase()
  
//   // Project planning
//   if (lowerMessage.includes('project') || lowerMessage.includes('plan')) {
//     return {
//       response: "I can help you break down your project into manageable tasks! Based on your request, here are some structured tasks to get you started:",
//       tasks: [
//         {
//           title: "Define project scope and objectives",
//           description: "Clearly outline what the project aims to achieve and its boundaries",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 60
//         },
//         {
//           title: "Create project timeline",
//           description: "Break down the project into phases with deadlines",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 45
//         },
//         {
//           title: "Identify required resources",
//           description: "List all tools, people, and materials needed for the project",
//           priority: "medium",
//           category: "Work",
//           estimatedTime: 30
//         }
//       ]
//     }
//   }
  
//   // Presentation preparation
//   if (lowerMessage.includes('presentation') || lowerMessage.includes('present')) {
//     return {
//       response: "Great! Let me help you prepare an effective presentation. Here are the key tasks to ensure you're well-prepared:",
//       tasks: [
//         {
//           title: "Research presentation topic",
//           description: "Gather relevant information, statistics, and examples for your presentation",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 90
//         },
//         {
//           title: "Create presentation outline",
//           description: "Structure your content with clear introduction, main points, and conclusion",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 30
//         },
//         {
//           title: "Design presentation slides",
//           description: "Create visually appealing slides with key points and visuals",
//           priority: "medium",
//           category: "Work",
//           estimatedTime: 120
//         },
//         {
//           title: "Practice presentation delivery",
//           description: "Rehearse your presentation multiple times to improve confidence",
//           priority: "medium",
//           category: "Work",
//           estimatedTime: 45
//         }
//       ]
//     }
//   }
  
//   // Learning/Study
//   if (lowerMessage.includes('learn') || lowerMessage.includes('study')) {
//     const subject = lowerMessage.includes('javascript') ? 'JavaScript' : 
//                    lowerMessage.includes('python') ? 'Python' :
//                    lowerMessage.includes('design') ? 'Design' : 'the subject'
    
//     return {
//       response: `Excellent! Learning ${subject} is a great goal. I've created a structured learning plan to help you progress effectively:`,
//       tasks: [
//         {
//           title: `Set up ${subject} learning environment`,
//           description: "Install necessary tools, create practice folders, and bookmark resources",
//           priority: "high",
//           category: "Learning",
//           estimatedTime: 30
//         },
//         {
//           title: `Complete ${subject} fundamentals course`,
//           description: "Work through basic concepts and complete exercises",
//           priority: "high",
//           category: "Learning",
//           estimatedTime: 180
//         },
//         {
//           title: `Build a practice project`,
//           description: "Apply what you've learned by creating a small project",
//           priority: "medium",
//           category: "Learning",
//           estimatedTime: 120
//         }
//       ]
//     }
//   }
  
//   // Meeting organization
//   if (lowerMessage.includes('meeting') || lowerMessage.includes('organize')) {
//     return {
//       response: "I'll help you organize an effective meeting! Here's what you need to prepare:",
//       tasks: [
//         {
//           title: "Create meeting agenda",
//           description: "List discussion topics, time allocations, and expected outcomes",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 20
//         },
//         {
//           title: "Send meeting invitations",
//           description: "Invite participants with agenda, date, time, and location details",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 15
//         },
//         {
//           title: "Prepare meeting materials",
//           description: "Gather documents, presentations, or resources needed for discussion",
//           priority: "medium",
//           category: "Work",
//           estimatedTime: 30
//         }
//       ]
//     }
//   }
  
//   // Website building
//   if (lowerMessage.includes('website') || lowerMessage.includes('web')) {
//     return {
//       response: "Building a website is exciting! Let me break this down into manageable steps:",
//       tasks: [
//         {
//           title: "Define website requirements",
//           description: "Determine purpose, target audience, and key features needed",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 45
//         },
//         {
//           title: "Create wireframes and design mockups",
//           description: "Plan the layout and visual design of your website pages",
//           priority: "high",
//           category: "Work",
//           estimatedTime: 90
//         },
//         {
//           title: "Set up development environment",
//           description: "Choose and configure your development tools and hosting platform",
//           priority: "medium",
//           category: "Work",
//           estimatedTime: 30
//         }
//       ]
//     }
//   }
  
//   // Generic helpful response for unclear requests
//   return {
//     response: "I'm here to help you organize your tasks! Could you tell me more specifically what you'd like to accomplish? For example, you could say 'I need to plan a project' or 'Help me prepare for a presentation' and I'll suggest structured tasks to help you succeed.",
//     tasks: []
//   }
// }

// export async function POST(request) {
//   try {
//     const session = await getServerSession(authOptions)
    
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const { message } = await request.json()

//     if (!message || typeof message !== 'string' || message.trim().length === 0) {
//       return NextResponse.json({ error: 'Message is required' }, { status: 400 })
//     }

//     if (message.length > 1000) {
//       return NextResponse.json({ error: 'Message too long' }, { status: 400 })
//     }

//     // Generate mock response
//     const mockResponse = generateMockResponse(message)

//     // Log the interaction
//     try {
//       await prisma.aILog.create({
//         data: {
//           userId: session.user.id,
//           action: mockResponse.tasks.length > 0 ? 'TASK_SUGGESTED' : 'TASK_ANALYZED',
//           prompt: message,
//           response: mockResponse.response,
//           metadata: {
//             model: 'mock-ai-dev',
//             tasksGenerated: mockResponse.tasks.length,
//             userAgent: request.headers.get('user-agent'),
//             timestamp: new Date().toISOString(),
//             isMock: true
//           }
//         }
//       })
//     } catch (logError) {
//       console.error('Failed to log AI interaction:', logError)
//     }

//     // Add small delay to simulate API call
//     await new Promise(resolve => setTimeout(resolve, 1000))

//     return NextResponse.json({
//       response: mockResponse.response,
//       tasks: mockResponse.tasks
//     })

//   } catch (error) {
//     console.error('Mock AI Chat API Error:', error)

//     // Log the error
//     try {
//       if (session?.user?.id) {
//         await prisma.aILog.create({
//           data: {
//             userId: session.user.id,
//             action: 'TASK_ANALYZED',
//             prompt: message || 'Unknown message',
//             response: 'Error occurred during processing',
//             metadata: {
//               error: error.message,
//               timestamp: new Date().toISOString(),
//               isMock: true
//             }
//           }
//         })
//       }
//     } catch (logError) {
//       console.error('Failed to log error:', logError)
//     }

//     return NextResponse.json(
//       { error: 'Failed to process your request. Please try again.' },
//       { status: 500 }
//     )
//   }
// }