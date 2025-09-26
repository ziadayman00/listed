'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, CheckCircle, Plus, X, Calendar, Clock, Tag, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AIChat({ onTaskCreate }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI assistant. Tell me what you need to get done and I'll help you create organized tasks. Try saying something like 'I need to plan my project' or 'Help me organize my week'.",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState([])
  const [creatingTasks, setCreatingTasks] = useState(new Set())
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now() + Math.random(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentMessage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      
      const aiMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        tasks: data.tasks && data.tasks.length > 0 ? data.tasks : null
      }

      setMessages(prev => [...prev, aiMessage])
      
      if (data.tasks && data.tasks.length > 0) {
        setSuggestedTasks(prev => [...prev, ...data.tasks])
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async (task) => {
    const taskId = `${task.title}-${Date.now()}`
    setCreatingTasks(prev => new Set(prev).add(taskId))

    try {
      // Calculate due date (3 days from now)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 3)
      const dueDateDay = dueDate.toISOString().split('T')[0]
      
      // Convert to API format
      const taskPayload = {
        title: task.title,
        description: task.description || '',
        priority: task.priority.toUpperCase(),
        dueDateDay: dueDateDay,
        dueTime: null,
        status: 'PENDING',
        tags: task.tags || [],
        category: task.category || 'Personal',
        estimatedTime: task.estimatedTime || null,
        reminders: null,
        isAIGenerated: true
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const createdTask = await response.json()

      // Remove task from suggestions
      setSuggestedTasks(prev => prev.filter(t => t.title !== task.title))

      // Notify parent component to refresh tasks list
      if (onTaskCreate) {
        onTaskCreate(createdTask)
      }

      // Add success confirmation message
      const confirmMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: `Perfect! I've successfully created "${task.title}" and added it to your task list. It's scheduled for ${dueDateDay} with ${task.priority} priority. You can find it in your overview.`,
        timestamp: new Date(),
        isSuccess: true
      }
      setMessages(prev => [...prev, confirmMessage])

    } catch (error) {
      console.error('Failed to create task:', error)
      
      // Add error message
      const errorMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: `I couldn't create the task "${task.title}" right now. ${error.message}. Please try again or create it manually.`,
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setCreatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  const quickSuggestions = [
    { text: 'Plan a project', icon: <Zap className="w-3 h-3" /> },
    { text: 'Prepare presentation', icon: <Calendar className="w-3 h-3" /> },
    { text: 'Organize meeting', icon: <Clock className="w-3 h-3" /> },
    { text: 'Build website', icon: <Tag className="w-3 h-3" /> }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col max-h-[600px]">
      {/* Enhanced Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#784e87]/5 to-purple-600/5">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-[#784e87] to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">AI Task Assistant</h2>
            <p className="text-sm text-gray-500">Chat to create tasks automatically</p>
          </div>
          {suggestedTasks.length > 0 && (
            <div className="bg-[#784e87] text-white text-xs px-2 py-1 rounded-full">
              {suggestedTasks.length} pending
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${
              message.type === 'ai' 
                ? 'bg-gradient-to-br from-[#784e87] to-purple-600' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              {message.type === 'ai' ? (
                <Bot className="h-4 w-4 text-white" />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-2xl max-w-[85%] shadow-sm ${
                message.type === 'ai'
                  ? message.isError 
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : message.isSuccess
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-gray-50 text-gray-900 border border-gray-100'
                  : 'bg-[#784e87] text-white'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              
              {/* Enhanced Task suggestions */}
              {message.tasks && (
                <div className="mt-3 space-y-2">
                  {message.tasks.map((task, index) => {
                    const taskId = `${task.title}-${Date.now()}`
                    const isCreating = Array.from(creatingTasks).some(id => id.includes(task.title))
                    
                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                              {task.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className="text-sm">
                              {getPriorityIcon(task.priority)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {task.category}
                            </span>
                            {task.estimatedTime && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.estimatedTime}min
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={() => handleCreateTask(task)}
                            disabled={isCreating}
                            className="bg-[#784e87] hover:bg-[#6b4476] disabled:bg-gray-300 text-white px-3 py-1 text-xs h-7 shadow-sm transition-colors"
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Task
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-[#784e87] to-purple-600 flex items-center justify-center shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#784e87] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#784e87] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#784e87] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center space-x-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you need to get done..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#784e87] focus:border-transparent text-sm shadow-sm transition-all"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-[#784e87] hover:bg-[#6b4476] disabled:bg-gray-300 text-white p-3 rounded-xl shadow-sm transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Enhanced Quick suggestions */}
        <div className="flex flex-wrap gap-2">
          {quickSuggestions.map((suggestion) => (
            <button
              key={suggestion.text}
              onClick={() => setInputMessage(suggestion.text)}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 bg-white border border-gray-200 hover:border-[#784e87] hover:bg-[#784e87]/5 text-gray-700 hover:text-[#784e87] rounded-lg transition-all shadow-sm"
              disabled={isLoading}
            >
              {suggestion.icon}
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}