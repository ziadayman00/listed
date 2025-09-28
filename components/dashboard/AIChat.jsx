'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, CheckCircle, Plus, X, Calendar, Clock, Tag, Zap, Loader2, Mic, MicOff, Volume2, VolumeX, Brain, Image, Paperclip, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AIChat({ onTaskCreate }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI assistant powered by Gemini. I can remember our conversations and help you create organized tasks. Try voice chat, upload images, or just tell me what you need to get done!",
      timestamp: new Date(),
      hasMemory: false
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState([])
  const [creatingTasks, setCreatingTasks] = useState(new Set())
  
  // Voice chat states
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('en-US-Studio-O')
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  
  // Session and memory states
  const [sessionId, setSessionId] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [memoriesUsed, setMemoriesUsed] = useState(0)
  const [memoriesCreated, setMemoriesCreated] = useState(0)
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const synthRef = useRef(null)

  // Available voices for Gemini
  const availableVoices = [
    { id: 'en-US-Studio-O', name: 'Studio O (Default)', language: 'English' },
    { id: 'en-US-Studio-Q', name: 'Studio Q (Warm)', language: 'English' },
    { id: 'en-GB-Studio-B', name: 'British Studio B', language: 'English (UK)' },
    { id: 'es-ES-Studio-C', name: 'Spanish Studio C', language: 'Spanish' },
    { id: 'fr-FR-Studio-D', name: 'French Studio D', language: 'French' },
    { id: 'de-DE-Studio-B', name: 'German Studio B', language: 'German' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
    }
  }, [sessionId])

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processVoiceInput(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processVoiceInput = async (audioBlob) => {
    // Convert audio blob to base64 for sending to API
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1]
      await handleSendMessage(null, 'VOICE', {
        mimeType: 'audio/wav',
        data: base64Audio
      })
    }
    reader.readAsDataURL(audioBlob)
  }

  // Handle file uploads
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleFileDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const convertFilesToAttachments = async (files) => {
    const attachments = []
    for (const file of files) {
      const reader = new FileReader()
      const result = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
      
      attachments.push({
        name: file.name,
        mimeType: file.type,
        data: result.split(',')[1], // Remove data:mime;base64, prefix
        size: file.size
      })
    }
    return attachments
  }

  const handleSendMessage = async (messageText = null, messageType = 'TEXT', audioData = null) => {
    const message = messageText || inputMessage
    if (!message?.trim() && !audioData && selectedFiles.length === 0) return
    if (isLoading) return

    const userMessage = {
      id: Date.now() + Math.random(),
      type: 'user',
      content: message || (audioData ? '[Voice Message]' : '[File Upload]'),
      timestamp: new Date(),
      hasAudio: !!audioData,
      hasFiles: selectedFiles.length > 0,
      fileNames: selectedFiles.map(f => f.name)
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = message
    setInputMessage('')
    setIsLoading(true)

    // Process file attachments
    let attachments = null
    if (selectedFiles.length > 0) {
      try {
        attachments = await convertFilesToAttachments(selectedFiles)
        setSelectedFiles([]) // Clear files after processing
      } catch (error) {
        console.error('Error processing files:', error)
      }
    }

    try {
      const requestBody = {
        message: currentMessage || 'Process the uploaded content',
        sessionId,
        type: messageType,
        voiceConfig: isVoiceMode ? { voiceName: selectedVoice } : null,
        attachments: audioData ? [{ mimeType: audioData.mimeType, data: audioData.data }] : attachments
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()
      
      // Update session info
      if (data.sessionId) setSessionId(data.sessionId)
      if (data.conversationId) setConversationId(data.conversationId)
      if (data.memoriesUsed !== undefined) setMemoriesUsed(data.memoriesUsed)
      if (data.memoriesCreated !== undefined) setMemoriesCreated(data.memoriesCreated)
      
      const aiMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        tasks: data.tasks && data.tasks.length > 0 ? data.tasks : null,
        hasMemory: data.memoriesUsed > 0 || data.memoriesCreated > 0,
        memoriesUsed: data.memoriesUsed || 0,
        memoriesCreated: data.memoriesCreated || 0,
        voiceEnabled: data.voiceEnabled
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Handle voice output if enabled
      if (isVoiceMode && synthRef.current && data.response) {
        speakText(data.response)
      }
      
      if (data.tasks && data.tasks.length > 0) {
        setSuggestedTasks(prev => [...prev, ...data.tasks])
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: `I'm having trouble connecting right now. ${error.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = (text) => {
    if (synthRef.current && !isPlaying) {
      setIsPlaying(true)
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Try to match selected Gemini voice with browser voice
      const voices = synthRef.current.getVoices()
      const matchingVoice = voices.find(voice => 
        voice.lang.includes(selectedVoice.split('-')[0]) || 
        voice.name.toLowerCase().includes('google')
      )
      if (matchingVoice) utterance.voice = matchingVoice
      
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      
      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsPlaying(false)
    }
  }

  const handleCreateTask = async (task) => {
    const taskId = `${task.title}-${Date.now()}`
    setCreatingTasks(prev => new Set(prev).add(taskId))

    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 3)
      const dueDateDay = dueDate.toISOString().split('T')[0]
      
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
      setSuggestedTasks(prev => prev.filter(t => t.title !== task.title))

      if (onTaskCreate) {
        onTaskCreate(createdTask)
      }

      const confirmMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: `Perfect! I've successfully created "${task.title}" and added it to your task list. It's scheduled for ${dueDateDay} with ${task.priority} priority.`,
        timestamp: new Date(),
        isSuccess: true
      }
      setMessages(prev => [...prev, confirmMessage])

    } catch (error) {
      console.error('Failed to create task:', error)
      
      const errorMessage = {
        id: Date.now() + Math.random(),
        type: 'ai',
        content: `I couldn't create the task "${task.title}" right now. ${error.message}. Please try again.`,
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
    <div className="bg-white rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-gray-100 h-full flex flex-col max-h-screen sm:max-h-[600px]">
      {/* Mobile-First Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-[#784e87]/5 to-purple-600/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-[#784e87] to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-1 sm:gap-2">
                <span className="truncate">AI Task Assistant</span>
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  Gemini 2.5
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Voice chat • Memory • Multimodal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Memory indicator */}
            {(memoriesUsed > 0 || memoriesCreated > 0) && (
              <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-1.5 sm:px-2 py-1 rounded-full">
                <Brain className="w-3 h-3" />
                <span className="hidden sm:inline">{memoriesUsed + memoriesCreated}</span>
              </div>
            )}
            
            {/* Voice mode toggle */}
            <Button
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-2 ${isVoiceMode ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
            >
              {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            {suggestedTasks.length > 0 && (
              <div className="bg-[#784e87] text-white text-xs px-2 py-1 rounded-full">
                {suggestedTasks.length}
              </div>
            )}
          </div>
        </div>
        
        {/* Voice settings - Mobile optimized */}
        {isVoiceMode && (
          <div className="space-y-2">
            <Button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs"
            >
              Voice Settings
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showVoiceSettings ? 'rotate-180' : ''}`} />
            </Button>
            
            {showVoiceSettings && (
              <div className="space-y-2">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                >
                  {availableVoices.map(voice => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.language})
                    </option>
                  ))}
                </select>
                {isPlaying && (
                  <Button onClick={stopSpeaking} size="sm" variant="outline" className="w-full">
                    <VolumeX className="w-3 h-3 mr-1" />
                    Stop Speaking
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages - Mobile optimized */}
      <div className="flex-1 p-2 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 sm:space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shadow-sm ${
              message.type === 'ai' 
                ? 'bg-gradient-to-br from-[#784e87] to-purple-600' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              {message.type === 'ai' ? (
                message.hasMemory ? <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-white" /> : <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              ) : (
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 min-w-0 ${message.type === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-2.5 sm:p-3 rounded-2xl max-w-[90%] sm:max-w-[85%] shadow-sm break-words ${
                message.type === 'ai'
                  ? message.isError 
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : message.isSuccess
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-gray-50 text-gray-900 border border-gray-100'
                  : 'bg-[#784e87] text-white'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Message metadata */}
                {message.type === 'user' && (message.hasAudio || message.hasFiles) && (
                  <div className="mt-2 text-xs opacity-75">
                    {message.hasAudio && '🎤 Voice'}
                    {message.hasFiles && (
                      <div className="truncate">
                        📎 {message.fileNames?.slice(0, 2).join(', ')}
                        {message.fileNames?.length > 2 && ` +${message.fileNames.length - 2} more`}
                      </div>
                    )}
                  </div>
                )}
                
                {message.type === 'ai' && message.hasMemory && (
                  <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    🧠 Used {message.memoriesUsed} • Created {message.memoriesCreated}
                  </div>
                )}
              </div>
              
              {/* Task suggestions - Mobile optimized */}
              {message.tasks && (
                <div className="mt-2 sm:mt-3 space-y-2">
                  {message.tasks.map((task, index) => {
                    const taskId = `${task.title}-${Date.now()}`
                    const isCreating = Array.from(creatingTasks).some(id => id.includes(task.title))
                    
                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                              {task.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <span className="text-sm">
                              {getPriorityIcon(task.priority)}
                            </span>
                            <span className={`text-xs px-1.5 sm:px-2 py-1 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span className="truncate max-w-16 sm:max-w-none">{task.category}</span>
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
                            className="bg-[#784e87] hover:bg-[#6b4476] disabled:bg-gray-300 text-white px-2 sm:px-3 py-1 text-xs h-6 sm:h-7 shadow-sm transition-colors"
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                <span className="hidden sm:inline">Adding...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Add Task</span>
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
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-[#784e87] to-purple-600 flex items-center justify-center shadow-sm">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-2.5 sm:p-3 shadow-sm">
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

      {/* File upload area - Mobile optimized */}
      {selectedFiles.length > 0 && (
        <div className="px-3 py-2 sm:px-4 border-t border-gray-100 bg-blue-50">
          <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
            <Paperclip className="w-4 h-4" />
            Selected files:
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs">
                {file.type.startsWith('image/') && '🖼️'}
                {file.type.startsWith('audio/') && '🎵'}
                {file.type.startsWith('video/') && '🎬'}
                {!file.type.startsWith('image/') && !file.type.startsWith('audio/') && !file.type.startsWith('video/') && '📄'}
                <span className="max-w-12 sm:max-w-20 truncate">{file.name}</span>
                <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile-First Input Area */}
      <div 
        className={`p-2 sm:p-4 border-t border-gray-100 bg-gray-50/30 ${isDragOver ? 'bg-blue-50 border-blue-200' : ''}`}
        onDrop={handleFileDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {/* Input row */}
        <div className="flex items-end space-x-1 sm:space-x-2 mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
                          <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isVoiceMode ? "Type or speak..." : "What needs to be done?"}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#784e87] focus:border-transparent text-sm shadow-sm transition-all resize-none"
              disabled={isLoading}
            />
          </div>
          
          {/* Action buttons - Mobile optimized */}
          <div className="flex items-end gap-1 flex-shrink-0">
            {/* File upload button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-10 w-10 p-0 rounded-xl border-gray-200"
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            {/* Voice recording button */}
            {isVoiceMode && (
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-10 w-10 p-0 rounded-xl ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Send button */}
            <Button
              onClick={() => handleSendMessage()}
              disabled={(!inputMessage.trim() && selectedFiles.length === 0) || isLoading}
              className="bg-[#784e87] hover:bg-[#6b4476] disabled:bg-gray-300 text-white h-10 w-10 p-0 rounded-xl shadow-sm transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Quick suggestions - Mobile responsive */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {quickSuggestions.map((suggestion) => (
            <button
              key={suggestion.text}
              onClick={() => setInputMessage(suggestion.text)}
              className="inline-flex items-center gap-1 text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200 hover:border-[#784e87] hover:bg-[#784e87]/5 text-gray-700 hover:text-[#784e87] rounded-lg transition-all shadow-sm"
              disabled={isLoading}
            >
              {suggestion.icon}
              <span className="truncate max-w-20 sm:max-w-none">{suggestion.text}</span>
            </button>
          ))}
        </div>
        
        {isDragOver && (
          <div className="text-center text-blue-600 text-sm mt-2">
            Drop files here to analyze with AI
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}