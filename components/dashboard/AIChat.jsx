'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, CheckCircle, Plus, X } from 'lucide-react'
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
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Call the AI API endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        tasks: data.tasks && data.tasks.length > 0 ? data.tasks : null
      }

      setMessages(prev => [...prev, aiMessage])
      
      if (data.tasks && data.tasks.length > 0) {
        setSuggestedTasks(data.tasks)
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: "Sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }


  const handleCreateTask = (task) => {
    // Add current date as due date (3 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)
    
    const taskWithDefaults = {
      ...task,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending'
    }

    if (onTaskCreate) {
      onTaskCreate(taskWithDefaults)
    }

    // Remove task from suggestions
    setSuggestedTasks(prev => prev.filter(t => t.title !== task.title))

    // Add confirmation message
    const confirmMessage = {
      id: messages.length + 1,
      type: 'ai',
      content: `Great! I've created the task "${task.title}" for you. It's been added to your task list with a ${task.priority} priority.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, confirmMessage])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-[#784e87] to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">Chat to create tasks automatically</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
              message.type === 'ai' 
                ? 'bg-gradient-to-br from-[#784e87] to-purple-600' 
                : 'bg-blue-500'
            }`}>
              {message.type === 'ai' ? (
                <Bot className="h-4 w-4 text-white" />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-2xl max-w-[85%] ${
                message.type === 'ai'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-[#784e87] text-white'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
              
              {/* Task suggestions */}
              {message.tasks && (
                <div className="mt-3 space-y-2">
                  {message.tasks.map((task, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{task.category}</span>
                        <Button
                          onClick={() => handleCreateTask(task)}
                          className="bg-[#784e87] hover:bg-[#6b4476] text-white px-3 py-1 text-xs h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-[#784e87] to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you need to get done..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-[#784e87] hover:bg-[#6b4476] text-white p-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['Plan a project', 'Prepare presentation', 'Organize meeting', 'Build website'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputMessage(suggestion)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
