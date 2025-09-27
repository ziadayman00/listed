// /api/ai/suggestions/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
let genAI
try {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error)
}

const SUGGESTIONS_PROMPT = `You are an AI productivity assistant that analyzes user task patterns and behaviors to provide intelligent suggestions. Based on the provided data, generate actionable suggestions to improve productivity.

Analyze the user's:
- Recent tasks and completion patterns
- Task categories and priorities
- Time management patterns
- Productivity trends
- Past conversations and memories

Generate suggestions in these categories:
1. task_creation - Suggest new tasks based on patterns
2. optimization - Improve existing workflow
3. deadline_optimization - Better time management
4. break_reminder - Wellness and productivity breaks
5. skill_development - Learning opportunities

For each suggestion, provide:
- Clear, actionable title
- Detailed description
- Confidence score (0-100)
- Reasoning based on data
- Priority level (low, medium, high)
- Estimated time
- Impact level (low, medium, high)
- Suggested date if applicable

Return EXACTLY this JSON format:
{
  "suggestions": [
    {
      "type": "task_creation|optimization|deadline_optimization|break_reminder|skill_development",
      "title": "Clear action title",
      "description": "Detailed description of the suggestion",
      "confidence": 85,
      "reasoning": "Data-based explanation for this suggestion",
      "category": "Work|Personal|Health|Learning|Shopping|Other",
      "priority": "low|medium|high",
      "estimatedTime": "30 min",
      "impact": "low|medium|high",
      "suggestedDate": "2024-01-17"
    }
  ]
}

Focus on practical, actionable suggestions that will genuinely help the user be more productive.`

async function getUserAnalyticsData(userId) {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  try {
    // Get recent tasks
    const recentTasks = await prisma.task.findMany({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Get completed tasks
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: oneWeekAgo }
      },
      orderBy: { completedAt: 'desc' },
      take: 20
    })

    // Get overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        OR: [
          { dueDate: { lt: now } },
          { dueDateDay: { lt: now.toISOString().split('T')[0] } }
        ]
      }
    })

    // Get user memories
    const memories = await prisma.geminiMemory.findMany({
      where: {
        userId,
        isActive: true
      },
      orderBy: { importance: 'desc' },
      take: 10
    })

    // Get recent AI conversations
    const recentConversations = await prisma.geminiConversation.findMany({
      where: {
        userId,
        lastActiveAt: { gte: oneWeekAgo }
      },
      include: {
        messages: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 3
    })

    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['category', 'priority', 'status'],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo }
      },
      _count: true
    })

    // Get user activity patterns
    const activityPattern = await prisma.userActivity.findMany({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return {
      recentTasks,
      completedTasks,
      overdueTasks,
      memories,
      recentConversations,
      taskStats,
      activityPattern,
      analytics: {
        totalTasks: recentTasks.length,
        completedCount: completedTasks.length,
        overdueCount: overdueTasks.length,
        completionRate: recentTasks.length > 0 ? (completedTasks.length / recentTasks.length) * 100 : 0,
        averageTasksPerDay: recentTasks.length / 7
      }
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return null
  }
}

function buildAnalysisPrompt(userData) {
  if (!userData) return SUGGESTIONS_PROMPT + '\n\nNo user data available. Provide general productivity suggestions.'

  const {
    recentTasks,
    completedTasks, 
    overdueTasks,
    memories,
    recentConversations,
    analytics
  } = userData

  let analysisContext = SUGGESTIONS_PROMPT + '\n\nUSER DATA ANALYSIS:\n\n'

  // Task patterns
  analysisContext += `TASK PATTERNS:\n`
  analysisContext += `- Total tasks this week: ${analytics.totalTasks}\n`
  analysisContext += `- Completed tasks: ${analytics.completedCount}\n`
  analysisContext += `- Overdue tasks: ${analytics.overdueCount}\n`
  analysisContext += `- Completion rate: ${analytics.completionRate.toFixed(1)}%\n`
  analysisContext += `- Average tasks per day: ${analytics.averageTasksPerDay.toFixed(1)}\n\n`

  // Recent task details
  if (recentTasks.length > 0) {
    analysisContext += `RECENT TASKS:\n`
    recentTasks.slice(0, 10).forEach(task => {
      analysisContext += `- "${task.title}" (${task.category}, ${task.priority} priority, ${task.status})\n`
    })
    analysisContext += '\n'
  }

  // Overdue tasks
  if (overdueTasks.length > 0) {
    analysisContext += `OVERDUE TASKS:\n`
    overdueTasks.forEach(task => {
      analysisContext += `- "${task.title}" (due: ${task.dueDateDay || 'unknown'})\n`
    })
    analysisContext += '\n'
  }

  // User memories
  if (memories.length > 0) {
    analysisContext += `USER PREFERENCES & MEMORIES:\n`
    memories.forEach(memory => {
      analysisContext += `- ${memory.key}: ${memory.value}\n`
    })
    analysisContext += '\n'
  }

  // Recent conversations
  if (recentConversations.length > 0) {
    analysisContext += `RECENT AI CONVERSATIONS:\n`
    recentConversations.forEach(conv => {
      analysisContext += `- Session: ${conv.type} (${conv.messages.length} messages)\n`
      if (conv.messages.length > 0) {
        analysisContext += `  Last message: "${conv.messages[0].content.substring(0, 100)}..."\n`
      }
    })
    analysisContext += '\n'
  }

  analysisContext += 'Based on this data, provide personalized suggestions to help improve productivity and task management.'

  return analysisContext
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!genAI) {
      throw new Error('Gemini AI not properly initialized')
    }

    // Get user analytics data
    const userData = await getUserAnalyticsData(session.user.id)
    
    // Build analysis prompt
    const analysisPrompt = buildAnalysisPrompt(userData)

    // Generate suggestions using Gemini with your model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Using latest Gemini 2.0 experimental model
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent suggestions
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    })

    const result = await model.generateContent(analysisPrompt)
    const response = result.response
    const aiResponse = response.text()

    if (!aiResponse) {
      throw new Error('No response from Gemini model')
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw AI response:', aiResponse)
      // Fallback to empty suggestions
      parsedResponse = { suggestions: [] }
    }

    // Validate and clean suggestions
    const validSuggestions = (parsedResponse.suggestions || [])
      .filter(s => s.title && s.description)
      .slice(0, 5) // Maximum 5 suggestions
      .map((suggestion, index) => ({
        id: Date.now() + index,
        type: suggestion.type || 'optimization',
        title: suggestion.title.substring(0, 100),
        description: suggestion.description.substring(0, 300),
        confidence: Math.min(Math.max(suggestion.confidence || 70, 0), 100),
        reasoning: suggestion.reasoning?.substring(0, 200) || 'AI-generated suggestion',
        category: suggestion.category || 'Personal',
        priority: ['low', 'medium', 'high'].includes(suggestion.priority) ? suggestion.priority : 'medium',
        estimatedTime: suggestion.estimatedTime || '15 min',
        impact: ['low', 'medium', 'high'].includes(suggestion.impact) ? suggestion.impact : 'medium',
        suggestedDate: suggestion.suggestedDate || null,
        createdAt: new Date().toISOString()
      }))

    // Log the AI interaction
    try {
      await prisma.aILog.create({
        data: {
          userId: session.user.id,
          action: 'TASK_ANALYZED',
          prompt: 'Generate AI suggestions based on user patterns',
          response: `Generated ${validSuggestions.length} suggestions`,
          metadata: {
            model: 'gemini-2.0-flash-exp',
            provider: 'gemini',
            suggestionsGenerated: validSuggestions.length,
            userTaskCount: userData?.analytics?.totalTasks || 0,
            completionRate: userData?.analytics?.completionRate || 0,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log AI suggestions:', logError)
    }

    return NextResponse.json({
      suggestions: validSuggestions,
      analytics: userData?.analytics || {},
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Suggestions API Error:', error)

    // Return fallback suggestions on error
    const fallbackSuggestions = [
      {
        id: 1,
        type: 'optimization',
        title: 'Review your task priorities',
        description: 'Take a few minutes to review and adjust the priority levels of your current tasks.',
        confidence: 75,
        reasoning: 'Regular priority reviews help maintain focus on important tasks.',
        category: 'Productivity',
        priority: 'medium',
        estimatedTime: '10 min',
        impact: 'medium',
        suggestedDate: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        type: 'break_reminder',
        title: 'Take a 5-minute break',
        description: 'Step away from your screen and take a short break to refresh your mind.',
        confidence: 80,
        reasoning: 'Regular breaks improve focus and prevent burnout.',
        category: 'Wellness',
        priority: 'low',
        estimatedTime: '5 min',
        impact: 'medium',
        suggestedDate: null,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json(
      { 
        suggestions: fallbackSuggestions,
        analytics: {},
        generatedAt: new Date().toISOString(),
        fallback: true
      },
      { status: 200 } // Return 200 with fallback data instead of error
    )
  }
}

// Handle suggestion actions (accept/reject)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, suggestionId, suggestionData } = await request.json()

    if (action === 'accept' && suggestionData) {
      // Handle accepted suggestion - create task, update settings, etc.
      if (suggestionData.type === 'task_creation') {
        // Create a new task based on the suggestion
        const newTask = await prisma.task.create({
          data: {
            userId: session.user.id,
            title: suggestionData.title,
            description: suggestionData.description,
            priority: suggestionData.priority.toUpperCase(),
            category: suggestionData.category,
            status: 'PENDING',
            dueDateDay: suggestionData.suggestedDate,
            isAIGenerated: true
          }
        })

        return NextResponse.json({ 
          success: true, 
          message: 'Task created from suggestion',
          taskId: newTask.id
        })
      }
    }

    // Log user feedback for AI learning
    await prisma.aILog.create({
      data: {
        userId: session.user.id,
        action: action === 'accept' ? 'TASK_SUGGESTED' : 'TASK_ANALYZED',
        prompt: `User ${action}ed suggestion: ${suggestionData?.title || 'Unknown'}`,
        response: action === 'accept' ? 'Suggestion accepted' : 'Suggestion rejected',
        metadata: {
          provider: 'gemini',
          model: 'gemini-2.0-flash-exp',
          suggestionId,
          suggestionType: suggestionData?.type,
          userAction: action,
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: `Suggestion ${action}ed successfully`
    })

  } catch (error) {
    console.error('Suggestion action error:', error)
    return NextResponse.json(
      { error: 'Failed to process suggestion action' },
      { status: 500 }
    )
  }
}