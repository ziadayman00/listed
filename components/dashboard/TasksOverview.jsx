'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Circle, 
  Clock, 
  Brain,
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Tag,
  Timer,
  Bell,
  Edit
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Helper functions
const getStatusIcon = (status) => {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'IN_PROGRESS':
      return <Clock className="w-5 h-5 text-blue-500" />
    default:
      return <Circle className="w-5 h-5 text-gray-400" />
  }
}

const getPriorityColor = (priority) => {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return 'text-red-600 bg-red-100'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100'
    case 'LOW':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

const getPriorityIcon = (priority) => {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return '🔴'
    case 'MEDIUM':
      return '🟡'
    case 'LOW':
      return '🟢'
    default:
      return '⚪'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return null
  
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
  return `In ${diffDays} days`
}

const formatEstimatedTime = (minutes) => {
  if (!minutes) return null
  
  if (minutes < 60) {
    return `${minutes}m`
  } else if (minutes < 1440) { // Less than a day
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  } else {
    const days = Math.floor(minutes / 1440)
    return `${days}d`
  }
}

export default function TasksOverview({ preview = false, tasksRefreshKey = 0, onOpenDeleteModal, onOpenEditModal }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks from API
  useEffect(() => {
    fetchTasks()
  }, [filterStatus, filterCategory, filterPriority, searchTerm, tasksRefreshKey])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (filterCategory !== 'all') {
        params.append('category', filterCategory)
      }
      if (filterPriority !== 'all') {
        params.append('priority', filterPriority)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (preview) {
        params.append('limit', '5')
      }

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesStatusFilter = filterStatus === 'all' || task.status === filterStatus
    const matchesCategoryFilter = filterCategory === 'all' || task.category === filterCategory
    const matchesPriorityFilter = filterPriority === 'all' || task.priority === filterPriority
    return matchesSearch && matchesStatusFilter && matchesCategoryFilter && matchesPriorityFilter
  })

  const displayTasks = preview ? filteredTasks.slice(0, 3) : filteredTasks

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    )
  }

  // Get unique categories for filter
  const uniqueCategories = [...new Set(tasks.map(task => task.category).filter(Boolean))]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {preview ? 'Recent Tasks' : 'My Tasks'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {preview ? 'Your latest task activity' : 'Manage and track your tasks'}
            </p>
          </div>
          {!preview && (
            <div className="text-sm text-gray-500">
              {displayTasks.length} of {tasks.length} tasks
            </div>
          )}
        </div>

        {!preview && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks, tags, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Status Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 sm:py-2 pr-10 focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Category Filter */}
              {uniqueCategories.length > 0 && (
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 sm:py-2 pr-10 focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Priority Filter */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 sm:py-2 pr-10 focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#784e87] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      )}

      {/* Tasks List */}
      {!isLoading && (
        <div className="divide-y divide-gray-100">
          {displayTasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first task'
                }
              </p>
              {!preview && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#784e87] text-white rounded-lg hover:bg-[#6b4476] transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </button>
              )}
            </div>
          ) : (
            displayTasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onTaskUpdate={handleTaskUpdate} 
                onOpenDeleteModal={onOpenDeleteModal}
                onOpenEditModal={onOpenEditModal}
              />
            ))
          )}
        </div>
      )}

      {preview && filteredTasks.length > 3 && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button className="text-[#784e87] hover:text-[#6b4476] font-medium">
            View all {filteredTasks.length} tasks →
          </button>
        </div>
      )}
    </div>
  )
}

// Individual Task Item Component
function TaskItem({ task, onTaskUpdate, onOpenDeleteModal, onOpenEditModal }) {
  const [isCompleted, setIsCompleted] = useState(task.status === 'COMPLETED')
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleComplete = async () => {
    if (isUpdating) return

    const newStatus = isCompleted ? 'PENDING' : 'COMPLETED'
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTask = await response.json()
      setIsCompleted(newStatus === 'COMPLETED')
      
      // Notify parent component of the update
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      // Revert the UI state on error
      setIsCompleted(task.status === 'COMPLETED')
    } finally {
      setIsUpdating(false)
    }
  }

  const hasReminder = task.reminders && task.reminders.enabled
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'

  return (
    <div className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-75' : ''}`}>
      <div className="flex items-start space-x-3 sm:space-x-4">
        {/* Status Icon */}
        <button 
          onClick={toggleComplete} 
          disabled={isUpdating}
          className="mt-1 disabled:opacity-50 flex-shrink-0"
        >
          {isUpdating ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#784e87] rounded-full animate-spin"></div>
          ) : isCompleted ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                {task.isAIGenerated && (
                  <Brain className="w-4 h-4 text-[#784e87] flex-shrink-0" title="AI Generated" />
                )}
                {hasReminder && (
                  <Bell className="w-4 h-4 text-blue-500 flex-shrink-0" title="Reminder set" />
                )}
                {isOverdue && (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" title="Overdue" />
                )}
              </div>
              
              {task.description && (
                <p className={`text-sm mt-1 line-clamp-2 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-[#784e87] text-white text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{task.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-2 sm:ml-4 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white rounded-lg shadow-lg border border-gray-100 p-1">
                <DropdownMenuItem 
                  onClick={() => onOpenEditModal(task)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-md"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onOpenDeleteModal(task)}
                  className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-md"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Task Meta */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-4 mt-3">
            {/* Priority */}
            <div className="flex items-center gap-1">
              <span className="text-sm">{getPriorityIcon(task.priority)}</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            {/* Category */}
            {task.category && (
              <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Tag className="w-3 h-3 mr-1" />
                {task.category}
              </span>
            )}

            {/* Estimated Time */}
            {task.estimatedTime && (
              <span className="inline-flex items-center text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                <Timer className="w-3 h-3 mr-1" />
                {formatEstimatedTime(task.estimatedTime)}
              </span>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                isOverdue 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-gray-500 bg-gray-100'
              }`}>
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(task.dueDate)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}