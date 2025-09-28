
// /api/ai/chat/route.js - Using Gemini AI with Voice & Memory Support
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `You are a helpful AI assistant that helps users create and organize tasks. You have access to conversation memory and can maintain context across sessions. When users describe what they need to do, analyze their message and:

1. Provide a friendly, helpful response that considers previous conversations
2. If appropriate, suggest structured tasks based on their request
3. Remember important user preferences and context for future interactions

For task suggestions, follow these rules:
- Break down complex requests into smaller, actionable tasks
- Assign appropriate priorities (low, medium, high) based on urgency/importance
- Suggest relevant categories (Work, Personal, Health, Learning, Shopping, Other)
- Keep titles concise but descriptive
- Provide helpful descriptions that clarify what needs to be done
- Only suggest tasks when the user's message clearly indicates work that needs to be done
- Consider the user's past tasks and preferences from memory

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
  ],
  "memories": [
    {
      "key": "unique_memory_key",
      "value": "information to remember",
      "type": "USER_PREFERENCE|TASK_CONTEXT|CONVERSATION",
      "importance": 0.8
    }
  ]
}

If not suggesting tasks, just respond with:
{
  "response": "Your helpful text response",
  "tasks": [],
  "memories": []
}

Guidelines:
- Keep responses conversational and encouraging
- Don't create tasks for vague requests like "help me" without specific context
- Maximum 5 tasks per request
- Focus on actionable, specific tasks
- Consider the user's context and needs
- Remember important information about user preferences, work patterns, and recurring tasks`

// Initialize Gemini AI
let genAI
try {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error)
}

// Helper function to get or create conversation
async function getOrCreateConversation(userId, sessionId, type = 'TEXT') {
  let conversation = await prisma.geminiConversation.findUnique({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20 // Last 20 messages for context
      },
      memories: {
        where: { isActive: true },
        orderBy: { importance: 'desc' }
      }
    }
  })

  if (!conversation) {
    conversation = await prisma.geminiConversation.create({
      data: {
        sessionId,
        userId,
        type,
        voiceEnabled: type === 'VOICE',
        model: 'gemini-2.5-pro'
      },
      include: {
        messages: true,
        memories: true
      }
    })
  }

  // Update last active time
  await prisma.geminiConversation.update({
    where: { id: conversation.id },
    data: { lastActiveAt: new Date() }
  })

  return conversation
}

// Helper function to retrieve relevant memories
async function getRelevantMemories(userId, messageContent) {
  const memories = await prisma.geminiMemory.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: [
      { importance: 'desc' },
      { lastAccessedAt: 'desc' }
    ],
    take: 10 // Top 10 most relevant memories
  })

  // Update access count and timestamp for retrieved memories
  if (memories.length > 0) {
    await prisma.geminiMemory.updateMany({
      where: {
        id: { in: memories.map(m => m.id) }
      },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    })
  }

  return memories
}

// Helper function to save memories
async function saveMemories(userId, conversationId, memories) {
  if (!memories || memories.length === 0) return

  const memoryPromises = memories.map(memory => 
    prisma.geminiMemory.upsert({
      where: {
        // Use individual fields since composite unique might not exist
        userId_key: {
          userId,
          key: memory.key
        }
      },
      update: {
        value: memory.value,
        importance: memory.importance || 0.5,
        lastAccessedAt: new Date()
      },
      create: {
        userId,
        conversationId,
        key: memory.key,
        value: memory.value,
        type: memory.type || 'CONVERSATION',
        importance: memory.importance || 0.5
      }
    }).catch(async (error) => {
      // If composite unique fails, try to find existing memory and update it
      console.log('Upsert failed, trying alternative approach:', error.message)
      
      const existingMemory = await prisma.geminiMemory.findFirst({
        where: {
          userId,
          key: memory.key
        }
      })

      if (existingMemory) {
        return prisma.geminiMemory.update({
          where: { id: existingMemory.id },
          data: {
            value: memory.value,
            importance: memory.importance || 0.5,
            lastAccessedAt: new Date()
          }
        })
      } else {
        return prisma.geminiMemory.create({
          data: {
            userId,
            conversationId,
            key: memory.key,
            value: memory.value,
            type: memory.type || 'CONVERSATION',
            importance: memory.importance || 0.5
          }
        })
      }
    })
  )

  await Promise.all(memoryPromises)
}

// Helper function to build context from conversation history and memories
function buildContextPrompt(conversation, memories, messageContent) {
  let context = SYSTEM_PROMPT + '\n\n'

  // Add memories to context
  if (memories.length > 0) {
    context += 'RELEVANT MEMORIES:\n'
    memories.forEach(memory => {
      context += `- ${memory.key}: ${memory.value}\n`
    })
    context += '\n'
  }

  // Add recent conversation history
  if (conversation.messages.length > 0) {
    context += 'RECENT CONVERSATION HISTORY:\n'
    conversation.messages.reverse().forEach(msg => {
      context += `${msg.role}: ${msg.content}\n`
    })
    context += '\n'
  }

  context += `Current user message: ${messageContent}`
  
  return context
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      message, 
      sessionId = `session_${session.user.id}_${Date.now()}`,
      type = 'TEXT',
      voiceConfig = null,
      attachments = null
    } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 5000) { // Increased for Gemini's larger context window
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    if (!genAI) {
      throw new Error('Gemini AI not properly initialized')
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(
      session.user.id, 
      sessionId, 
      type
    )

    // Get relevant memories
    const memories = await getRelevantMemories(session.user.id, message)

    // Build context with memories and conversation history
    const contextPrompt = buildContextPrompt(conversation, memories, message)

    // Initialize Gemini model with appropriate configuration
    const modelConfig = {
      model: conversation.model,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    }

    // Add voice configuration if enabled
    if (type === 'VOICE' && voiceConfig) {
      modelConfig.generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceConfig.voiceName || 'en-US-Studio-O'
          }
        }
      }
    }

    const model = genAI.getGenerativeModel(modelConfig)

    // Create the chat or generate content based on type
    let result
    if (type === 'VOICE' || attachments) {
      // Handle multimodal content
      const parts = [{ text: contextPrompt }]
      
      if (attachments) {
        // Add attachments (images, audio, etc.)
        attachments.forEach(attachment => {
          parts.push({
            inlineData: {
              mimeType: attachment.mimeType,
              data: attachment.data
            }
          })
        })
      }

      result = await model.generateContent(parts)
    } else {
      // Standard text conversation
      result = await model.generateContent(contextPrompt)
    }

    const response = result.response
    const aiResponse = response.text()

    if (!aiResponse) {
      throw new Error('No response from Gemini model')
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      parsedResponse = {
        response: aiResponse,
        tasks: [],
        memories: []
      }
    }

    // Validate the parsed response structure
    if (!parsedResponse.response) {
      parsedResponse.response = aiResponse
    }
    if (!Array.isArray(parsedResponse.tasks)) {
      parsedResponse.tasks = []
    }
    if (!Array.isArray(parsedResponse.memories)) {
      parsedResponse.memories = []
    }

    // Validate and clean task data
    const validTasks = parsedResponse.tasks
      .slice(0, 5)
      .map(task => {
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

    // Save conversation messages
    await prisma.geminiMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'user',
          content: message,
          hasAudio: type === 'VOICE',
          attachments: attachments ? JSON.stringify(attachments) : null
        },
        {
          conversationId: conversation.id,
          role: 'model',
          content: parsedResponse.response,
          tokenCount: response.usageMetadata?.totalTokenCount || 0,
          finishReason: response.candidates?.[0]?.finishReason || null,
          safetyRatings: response.candidates?.[0]?.safetyRatings ? 
            JSON.stringify(response.candidates[0].safetyRatings) : null
        }
      ]
    })

    // Save memories if any
    if (parsedResponse.memories.length > 0) {
      await saveMemories(session.user.id, conversation.id, parsedResponse.memories)
    }

    // Log the AI interaction
    try {
      await prisma.aILog.create({
        data: {
          userId: session.user.id,
          action: validTasks.length > 0 ? 'TASK_SUGGESTED' : 'GEMINI_CHAT_STARTED',
          prompt: message,
          response: parsedResponse.response,
          metadata: {
            model: conversation.model,
            provider: 'gemini',
            conversationId: conversation.id,
            sessionId,
            type,
            tokensUsed: response.usageMetadata?.totalTokenCount || 0,
            tasksGenerated: validTasks.length,
            memoriesCreated: parsedResponse.memories.length,
            memoriesRetrieved: memories.length,
            voiceEnabled: type === 'VOICE',
            hasAttachments: !!attachments,
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log AI interaction:', logError)
    }

    // Return response
    return NextResponse.json({
      response: parsedResponse.response,
      tasks: validTasks,
      sessionId,
      conversationId: conversation.id,
      voiceEnabled: conversation.voiceEnabled,
      memoriesUsed: memories.length,
      memoriesCreated: parsedResponse.memories.length
    })

  } catch (error) {
    console.error('Gemini AI Chat API Error:', error)

    // Log the error
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        // Get the message from the request body we parsed earlier
        const requestBody = await request.json().catch(() => ({}))
        const { message: errorMessage } = requestBody || {}
        
        await prisma.aILog.create({
          data: {
            userId: session.user.id,
            action: 'GEMINI_CHAT_STARTED',
            prompt: errorMessage || 'Unknown message',
            response: 'Error occurred during processing',
            metadata: {
              provider: 'gemini',
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
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'AI service quota exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (error.message?.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    if (error.message?.includes('SAFETY')) {
      return NextResponse.json(
        { error: 'Message blocked by safety filters. Please rephrase your request.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    )
  }
}



// // /api/ai/chat/route.js - Fixed version
// import { NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'
// import { GoogleGenerativeAI } from '@google/generative-ai'

// const SYSTEM_PROMPT = `You are an intelligent AI assistant that helps users create detailed, researched tasks and maintains conversation memory. You have access to current information and can provide comprehensive guidance.

// When users describe what they want to learn or accomplish:

// 1. Provide a helpful, conversational response that shows you understand their needs
// 2. Use your knowledge to research and provide detailed information about the topic
// 3. Create comprehensive, well-researched tasks with detailed descriptions
// 4. Remember previous conversations and build upon them

// For task suggestions, follow these enhanced rules:
// - Break down complex learning goals into structured, progressive tasks
// - Research and include specific details, resources, and step-by-step guidance in descriptions
// - Assign appropriate priorities based on learning progression and complexity
// - Suggest relevant categories and tags
// - Include realistic time estimates
// - For technical topics (like React hooks), provide comprehensive lists and examples in descriptions
// - For learning paths, create sequential tasks that build upon each other
// - Include practical exercises and projects where appropriate

// IMPORTANT: Always provide detailed, researched information in task descriptions. For example:
// - If they want to learn React hooks, list all hooks with brief explanations
// - If they want to build a portfolio, include specific sections and technologies
// - If they want to learn a programming language, break it into concepts and practical projects

// Format your response as JSON:
// {
//   "response": "Your conversational response that shows understanding and provides insights",
//   "tasks": [
//     {
//       "title": "Specific, actionable task title",
//       "description": "Detailed description with research, examples, resources, or step-by-step guidance (can be longer than 500 chars for educational content)",
//       "priority": "low|medium|high",
//       "category": "Learning|Work|Personal|Health|Projects|Research|Other",
//       "estimatedTime": 60,
//       "tags": ["relevant", "tags", "for", "organization"]
//     }
//   ]
// }

// Guidelines:
// - Use conversation history to provide contextual responses
// - Build upon previous discussions and tasks
// - Provide educational value in every response
// - Research topics thoroughly and include current best practices
// - Create learning paths that progress logically
// - Include both theoretical knowledge and practical application
// - Maximum 5 tasks per request, but make them comprehensive
// - Always explain WHY certain approaches or priorities are recommended`

// export async function POST(request) {
//   let userMessage // Declare at function scope to fix the error logging issue
  
//   try {
//     const session = await getServerSession(authOptions)
    
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     const { message, conversationHistory = [] } = await request.json()
//     userMessage = message // Assign here so it's available in catch block

//     if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
//       return NextResponse.json({ error: 'Message is required' }, { status: 400 })
//     }

//     if (userMessage.length > 2000) {
//       return NextResponse.json({ error: 'Message too long' }, { status: 400 })
//     }

//     // Initialize Google Gemini
//     const apiKey = process.env.GOOGLE_GEMINI_API_KEY
//     if (!apiKey) {
//       throw new Error('GOOGLE_GEMINI_API_KEY not configured')
//     }

//     const genAI = new GoogleGenerativeAI(apiKey)
//     // Fix: Use correct model name without version suffix
//     const model = genAI.getGenerativeModel({ 
//       model: "gemini-1.5-flash", // Remove the "-002" suffix
//       generationConfig: {
//         temperature: 0.7,
//         topK: 40,
//         topP: 0.95,
//         maxOutputTokens: 2048,
//       },
//     })

//     // Prepare conversation context
//     let conversationContext = ""
//     if (conversationHistory.length > 0) {
//       conversationContext = "\n\nPrevious conversation context:\n" + 
//         conversationHistory.slice(-6).map(msg => 
//           `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
//         ).join('\n')
//     }

//     const prompt = `${SYSTEM_PROMPT}${conversationContext}\n\nCurrent user message: ${userMessage}\n\nProvide a JSON response with comprehensive task suggestions and detailed research.`

//     // Call Gemini API
//     const result = await model.generateContent(prompt)
//     const response = await result.response
//     const aiResponse = response.text()

//     if (!aiResponse) {
//       throw new Error('No response from Gemini AI')
//     }

//     let parsedResponse
//     try {
//       // Extract JSON from response (Gemini sometimes adds extra text)
//       const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
//       if (jsonMatch) {
//         parsedResponse = JSON.parse(jsonMatch[0])
//       } else {
//         parsedResponse = JSON.parse(aiResponse)
//       }
//     } catch (parseError) {
//       console.warn('Failed to parse JSON, treating as text response:', parseError)
//       parsedResponse = {
//         response: aiResponse,
//         tasks: []
//       }
//     }

//     // Validate response structure
//     if (!parsedResponse.response) {
//       parsedResponse.response = aiResponse
//     }
//     if (!Array.isArray(parsedResponse.tasks)) {
//       parsedResponse.tasks = []
//     }

//     // Validate and clean task data with enhanced validation
//     const validTasks = parsedResponse.tasks
//       .slice(0, 5) // Maximum 5 tasks
//       .map(task => {
//         if (!task.title || typeof task.title !== 'string') return null
        
//         const cleanTask = {
//           title: task.title.slice(0, 150).trim(),
//           description: (task.description || '').slice(0, 2000).trim(), // Increased limit for educational content
//           priority: ['low', 'medium', 'high'].includes(task.priority?.toLowerCase()) 
//             ? task.priority.toLowerCase() 
//             : 'medium',
//           category: ['Learning', 'Work', 'Personal', 'Health', 'Projects', 'Research', 'Other'].includes(task.category)
//             ? task.category
//             : 'Learning',
//           estimatedTime: typeof task.estimatedTime === 'number' && task.estimatedTime > 0
//             ? Math.min(task.estimatedTime, 9999)
//             : 60,
//           tags: Array.isArray(task.tags) 
//             ? task.tags.slice(0, 10).map(tag => String(tag).slice(0, 30).trim()).filter(Boolean)
//             : []
//         }
        
//         return cleanTask.title ? cleanTask : null
//       })
//       .filter(Boolean)

//     // Store conversation in database for persistent memory
//     try {
//       await prisma.conversation.create({
//         data: {
//           userId: session.user.id,
//           userMessage: userMessage,
//           aiResponse: parsedResponse.response,
//           tasksGenerated: validTasks.length,
//           metadata: {
//             model: 'gemini-1.5-flash',
//             provider: 'google-gemini',
//             conversationLength: conversationHistory.length,
//             timestamp: new Date().toISOString(),
//             tokensEstimated: aiResponse.length / 4, // Rough token estimate
//           }
//         }
//       })
//     } catch (dbError) {
//       console.error('Failed to store conversation:', dbError)
//       // Note: If Conversation model doesn't exist, you may need to add it to your schema
//     }

//     // Log the AI interaction
//     try {
//       await prisma.aILog.create({
//         data: {
//           userId: session.user.id,
//           action: validTasks.length > 0 ? 'TASK_SUGGESTED' : 'TASK_ANALYZED',
//           prompt: userMessage,
//           response: parsedResponse.response,
//           metadata: {
//             model: 'gemini-1.5-flash',
//             provider: 'google-gemini',
//             tokensEstimated: aiResponse.length / 4,
//             tasksGenerated: validTasks.length,
//             conversationContext: conversationHistory.length > 0,
//             userAgent: request.headers.get('user-agent'),
//             timestamp: new Date().toISOString()
//           }
//         }
//       })
//     } catch (logError) {
//       console.error('Failed to log AI interaction:', logError)
//     }

//     return NextResponse.json({
//       response: parsedResponse.response,
//       tasks: validTasks
//     })

//   } catch (error) {
//     console.error('Google Gemini AI Chat API Error:', error)

//     // Log the error - userMessage is now in scope
//     try {
//       const session = await getServerSession(authOptions)
//       if (session?.user?.id) {
//         await prisma.aILog.create({
//           data: {
//             userId: session.user.id,
//             action: 'TASK_ERROR',
//             prompt: userMessage || 'Unknown message', // Now userMessage is defined
//             response: 'Error occurred during processing',
//             metadata: {
//               provider: 'google-gemini',
//               error: error.message,
//               timestamp: new Date().toISOString()
//             }
//           }
//         })
//       }
//     } catch (logError) {
//       console.error('Failed to log error:', logError)
//     }

//     // Return user-friendly error messages
//     if (error.message?.includes('quota') || error.message?.includes('limit')) {
//       return NextResponse.json(
//         { error: 'AI service quota exceeded. Please try again later.' },
//         { status: 429 }
//       )
//     }

//     if (error.message?.includes('API key')) {
//       return NextResponse.json(
//         { error: 'AI service configuration error. Please contact support.' },
//         { status: 500 }
//       )
//     }

//     if (error.message?.includes('safety')) {
//       return NextResponse.json(
//         { error: 'Message flagged by safety filters. Please rephrase your request.' },
//         { status: 400 }
//       )
//     }

//     return NextResponse.json(
//       { error: 'Failed to process your request. Please try again.' },
//       { status: 500 }
//     )
//   }
// }