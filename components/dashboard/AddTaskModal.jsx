'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Calendar, Flag, Clock, Tag, ChevronDown, ChevronUp, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddTaskModal({ 
  onClose, 
  onTaskCreate, 
  onTaskUpdate, 
  editMode = false, 
  taskToEdit = null 
}) {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    status: 'pending',
    tags: [],
    category: '',
    estimatedTime: '',
    reminders: {
      enabled: false,
      time: '1day'
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [currentTag, setCurrentTag] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

  // Pre-fill form if editing or defaultData is provided
  useEffect(() => {
    if (editMode && taskToEdit) {
      // Format the task data for editing
      const formattedData = {
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority?.toLowerCase() || 'medium',
        dueDate: taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '',
        dueTime: taskToEdit.dueDate && taskToEdit.hasDueTime ? (() => {
          const d = new Date(taskToEdit.dueDate)
          const hh = String(d.getHours()).padStart(2, '0')
          const mm = String(d.getMinutes()).padStart(2, '0')
          return `${hh}:${mm}`
        })() : '',
        status: taskToEdit.status?.toLowerCase() || 'pending',
        tags: taskToEdit.tags || [],
        category: taskToEdit.category || '',
        estimatedTime: taskToEdit.estimatedTime?.toString() || '',
        reminders: taskToEdit.reminders || { enabled: false, time: '1day' }
      }
      
      setTaskData(formattedData)
      
      // Show advanced options if there's existing advanced data
      if (taskToEdit.category || taskToEdit.estimatedTime || taskToEdit.tags?.length > 0 || taskToEdit.description) {
        setShowAdvanced(true)
      }
    }
  }, [editMode, taskToEdit])

  const validateForm = () => {
    const newErrors = {}
    
    if (!taskData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (taskData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (taskData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }
    
    if (taskData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }
    
    if (taskData.dueDate && taskData.dueDate < today && !editMode) {
      newErrors.dueDate = 'Due date cannot be in the past'
    }

    if (taskData.estimatedTime && (isNaN(taskData.estimatedTime) || taskData.estimatedTime <= 0)) {
      newErrors.estimatedTime = 'Estimated time must be a positive number'
    }

    // Optional time validation when provided
    if (taskData.dueTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(taskData.dueTime)) {
        newErrors.dueTime = 'Invalid time format'
      }
      if (!taskData.dueDate) {
        newErrors.dueDate = 'Select a date when providing a time'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setErrors({})

    try {
      const payload = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        priority: taskData.priority.toUpperCase(),
        // Use new API shape: send day and optional time; keep dueDate null for clarity
        dueDate: null,
        dueDateDay: taskData.dueDate || null,
        dueTime: taskData.dueTime || null,
        status: taskData.status.toUpperCase(),
        tags: taskData.tags,
        category: taskData.category.trim() || null,
        estimatedTime: taskData.estimatedTime ? parseInt(taskData.estimatedTime) : null,
        reminders: taskData.reminders.enabled ? taskData.reminders : null
      }

      const isEdit = editMode && taskToEdit
      const url = isEdit ? `/api/tasks/${taskToEdit.id}` : '/api/tasks'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} task`)
      }

      const updatedTask = await response.json()
      
      // Clear draft on success
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('taskDraft')
        } catch (error) {
          // Silently handle localStorage errors
        }
      }
      
      // Call appropriate callback
      if (isEdit && onTaskUpdate) {
        onTaskUpdate(updatedTask)
      } else if (!isEdit && onTaskCreate) {
        onTaskCreate(updatedTask)
      }
      
      onClose()
      
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} task:`, error)
      setErrors({ submit: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = (e) => {
    e.preventDefault()
    if (currentTag.trim() && !taskData.tags.includes(currentTag.trim()) && taskData.tags.length < 5) {
      setTaskData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTaskData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e)
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Auto-save draft functionality (only for create mode)
  useEffect(() => {
    if (!editMode && typeof window !== 'undefined') {
      const draftTimer = setTimeout(() => {
        if (taskData.title.trim()) {
          try {
            localStorage.setItem('taskDraft', JSON.stringify(taskData))
          } catch (error) {
            // Silently handle localStorage errors
          }
        }
      }, 2000)
      
      return () => clearTimeout(draftTimer)
    }
  }, [taskData, editMode])

  // Load draft on component mount (only for create mode)
  useEffect(() => {
    if (!editMode && typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem('taskDraft')
        if (draft) {
          const parsedDraft = JSON.parse(draft)
          setTaskData(prev => ({ ...prev, ...parsedDraft }))
        }
      } catch (error) {
        // Silently handle localStorage errors
      }
    }
  }, [editMode])

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' }
  ]

  const categories = ['Work', 'Personal', 'Health', 'Learning', 'Shopping', 'Other']
  const reminderOptions = [
    { value: '30min', label: '30 min before' },
    { value: '1hour', label: '1 hour before' },
    { value: '1day', label: '1 day before' },
    { value: '1week', label: '1 week before' }
  ]

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div 
        className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-2xl sm:max-w-lg sm:m-4 overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {/* Header - Mobile optimized */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sm:rounded-t-2xl">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {editMode ? 'Edit Task' : 'Add Task'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {typeof window !== 'undefined' && window.innerWidth > 768 ? 'Press Ctrl+Enter to save quickly' : `${editMode ? 'Update' : 'Fill in'} the details below`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form - Mobile optimized spacing */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}
          
          {/* Task Title - Larger on mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={taskData.title}
              onChange={(e) => {
                setTaskData({ ...taskData, title: e.target.value })
                if (errors.title) setErrors({...errors, title: ''})
              }}
              placeholder="What needs to be done?"
              className={`w-full px-4 py-4 sm:py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {taskData.title.length}/100
              </p>
            </div>
          </div>

          {/* Priority - Mobile optimized buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Flag className="h-4 w-4 inline mr-1" />
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setTaskData({ ...taskData, priority: priority.value })}
                  className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1 ${
                    taskData.priority === priority.value
                      ? `${priority.color}`
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">{priority.icon}</span>
                  <span className="hidden xs:inline">{priority.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status - Only show in edit mode */}
          {editMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={taskData.status}
                onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
                className="w-full px-4 py-4 sm:py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Due Date - Full width on mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={taskData.dueDate}
              min={editMode ? undefined : today}
              onChange={(e) => {
                setTaskData({ ...taskData, dueDate: e.target.value })
                if (errors.dueDate) setErrors({...errors, dueDate: ''})
              }}
              className={`w-full px-4 py-4 sm:py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent ${
                errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
            )}
            {/* Optional time input appears when a date is selected */}
            {taskData.dueDate && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Specific Time (Optional)
                </label>
                <input
                  type="time"
                  value={taskData.dueTime}
                  onChange={(e) => {
                    setTaskData({ ...taskData, dueTime: e.target.value })
                    if (errors.dueTime) setErrors({ ...errors, dueTime: '' })
                  }}
                  className={`w-full px-4 py-4 sm:py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent ${
                    errors.dueTime ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.dueTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueTime}</p>
                )}
              </div>
            )}
          </div>

          {/* Reminders - Only show if due date is set */}
          {taskData.dueDate && (
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Set Reminder
                </label>
                <input
                  type="checkbox"
                  checked={taskData.reminders.enabled}
                  onChange={(e) => setTaskData({
                    ...taskData,
                    reminders: { ...taskData.reminders, enabled: e.target.checked }
                  })}
                  className="h-5 w-5 sm:h-4 sm:w-4 text-[#784e87] focus:ring-[#784e87] border-gray-300 rounded"
                />
              </div>
              {taskData.reminders.enabled && (
                <select
                  value={taskData.reminders.time}
                  onChange={(e) => setTaskData({
                    ...taskData,
                    reminders: { ...taskData.reminders, time: e.target.value }
                  })}
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                >
                  {reminderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Advanced Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>More Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Advanced Options - Collapsible */}
          {showAdvanced && (
            <div className="space-y-4 sm:space-y-6 border-t border-gray-100 pt-4 sm:pt-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={taskData.category}
                  onChange={(e) => setTaskData({ ...taskData, category: e.target.value })}
                  className="w-full px-4 py-4 sm:py-3 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => {
                    setTaskData({ ...taskData, description: e.target.value })
                    if (errors.description) setErrors({...errors, description: ''})
                  }}
                  placeholder="Add more details..."
                  rows={3}
                  maxLength={500}
                  className={`w-full px-4 py-4 sm:py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {taskData.description.length}/500
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Max 5)
                </label>
                {taskData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {taskData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-[#784e87] text-white text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:bg-[#6b4476] rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(e)
                      }
                    }}
                    placeholder="Add a tag..."
                    maxLength={20}
                    disabled={taskData.tags.length >= 5}
                    className="flex-1 px-4 py-3 sm:py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent disabled:bg-gray-100"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!currentTag.trim() || taskData.tags.length >= 5 || taskData.tags.includes(currentTag.trim())}
                    variant="outline"
                    size="sm"
                    className="px-4 py-3 sm:py-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {taskData.tags.length}/5 tags used
                </p>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={taskData.estimatedTime}
                  onChange={(e) => {
                    setTaskData({ ...taskData, estimatedTime: e.target.value })
                    if (errors.estimatedTime) setErrors({...errors, estimatedTime: ''})
                  }}
                  placeholder="e.g., 30"
                  className={`w-full px-4 py-4 sm:py-3 text-base sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent ${
                    errors.estimatedTime ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.estimatedTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedTime}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - Mobile optimized */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="w-full sm:flex-1 py-4 sm:py-3 text-base sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !taskData.title.trim()}
              className="w-full sm:flex-1 bg-[#784e87] hover:bg-[#6b4476] text-white py-4 sm:py-3 text-base sm:text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {editMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editMode ? (
                    <Edit className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editMode ? 'Update Task' : 'Add Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}