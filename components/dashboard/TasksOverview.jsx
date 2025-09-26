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
  Edit,
  X,
  User,
  FileText,
  Target
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

const formatDate = (task) => {
  // Handle new data structure: check both dueDate and dueDateDay
  let dateString = null;

  if (task.hasDueTime && task.dueDate) {
    // Task with specific time - use full datetime
    dateString = task.dueDate;
  } else if (task.dueDateDay) {
    // Date-only task - use the date day
    dateString = task.dueDateDay;
  } else {
    // No date set
    return null;
  }

  if (!dateString) return null;

  // Handle date-only strings (YYYY-MM-DD) without timezone conversion
  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // For date-only strings, parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    date = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    // For full datetime strings
    date = new Date(dateString);
  }

  // Create today's date at midnight for proper comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create comparison date at midnight
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // For tasks with specific time, show the time too
    if (task.hasDueTime && task.dueDate) {
      const timeString = new Date(task.dueDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return `Today at ${timeString}`;
    }
    return 'Today';
  }
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}

const formatFullDate = (task) => {
  let dateString = null;

  if (task.hasDueTime && task.dueDate) {
    dateString = task.dueDate;
  } else if (task.dueDateDay) {
    dateString = task.dueDateDay;
  } else {
    return null;
  }

  if (!dateString) return null;

  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateString);
  }

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  if (task.hasDueTime && task.dueDate) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return date.toLocaleDateString('en-US', options);
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

// Option 1: Enhanced backdrop blur with better browser support
function TaskDetailModal({ task, isOpen, onClose, onTaskUpdate, onOpenEditModal, onOpenDeleteModal }) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen || !task) return null

  // Your existing logic here...
  const hasReminder = task.reminders && task.reminders.enabled
  const isOverdue = (() => {
    let taskDate = null;

    if (task.hasDueTime && task.dueDate) {
      taskDate = new Date(task.dueDate);
    } else if (task.dueDateDay) {
      const [year, month, day] = task.dueDateDay.split('-').map(Number);
      taskDate = new Date(year, month - 1, day);
      taskDate.setHours(23, 59, 59, 999);
    }

    return taskDate && task.status !== 'COMPLETED' && taskDate < new Date();
  })();

  const toggleComplete = async () => {
    if (isUpdating) return

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
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
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Enhanced blur backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md backdrop-saturate-150"
        onClick={onClose} />

      {/* Modal content with relative positioning */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Rest of your modal content remains the same... */}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleComplete}
              disabled={isUpdating}
              className="disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-[#784e87] rounded-full animate-spin"></div>
              ) : (
                getStatusIcon(task.status)
              )}
            </button>
            <div>
              <h2 className={`text-xl font-bold ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {task.isAIGenerated && (
                  <span className="inline-flex items-center px-2 py-1 bg-[#784e87] text-white text-xs rounded-full">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Generated
                  </span>
                )}
                {hasReminder && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    <Bell className="w-3 h-3 mr-1" />
                    Reminder Set
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEditModal(task)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenDeleteModal(task)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Details */}
            <div className="space-y-4">
              {/* Description */}
              {task.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">Description</h3>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">Status</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <span className="text-sm text-gray-700 capitalize">
                    {task.status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">Priority</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Meta Information */}
            <div className="space-y-4">
              {/* Due Date */}
              {(task.dueDate || task.dueDateDay) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">Due Date</h3>
                  </div>
                  <p className={`text-sm p-3 rounded-lg ${isOverdue ? 'text-red-600 bg-red-50' : 'text-gray-700 bg-gray-50'}`}>
                    {formatFullDate(task)}
                  </p>
                </div>
              )}

              {/* Category */}
              {task.category && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">Category</h3>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {task.category}
                  </span>
                </div>
              )}

              {/* Estimated Time */}
              {task.estimatedTime && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">Estimated Time</h3>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                    {formatEstimatedTime(task.estimatedTime)}
                  </span>
                </div>
              )}

              {/* Assignee */}
              {task.assignee && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">Assignee</h3>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {task.assignee}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-[#784e87] text-white text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reminders */}
          {hasReminder && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Reminders</h3>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Reminder is enabled for this task
                  </span>
                </div>
                {task.reminders.time && (
                  <p className="text-sm text-blue-700 mt-1">
                    Reminder time: {new Date(task.reminders.time).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Timestamps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Created:</span>
                <br />
                {new Date(task.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>
                <br />
                {new Date(task.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Alternative Option 2: CSS-in-JS approach with inline styles for better blur control
function TaskDetailModalWithCustomBlur({ task, isOpen, onClose, onTaskUpdate, onOpenEditModal, onOpenDeleteModal }) {
  // ... same logic as above ...

  const backdropStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px) saturate(180%)',
    WebkitBackdropFilter: 'blur(8px) saturate(180%)', // Safari support
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="absolute inset-0"
        style={backdropStyle}
        onClick={onClose}
      />
      {/* Rest of modal content... */}
    </div>
  )
}

// Option 3: Glassmorphism effect with enhanced blur
const glassmorphismBackdrop = `
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(150%) contrast(120%);
  -webkit-backdrop-filter: blur(10px) saturate(150%) contrast(120%);
  border: 1px solid rgba(255, 255, 255, 0.2);
`
export default function TasksOverview({ preview = false, tasksRefreshKey = 0, onOpenDeleteModal, onOpenEditModal }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

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
    // Update selected task if it's the one being updated
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTask(null)
  }

  // Get unique categories for filter
  const uniqueCategories = [...new Set(tasks.map(task => task.category).filter(Boolean))]

  return (
    <>
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
                  onTaskClick={handleTaskClick}
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onTaskUpdate={handleTaskUpdate}
        onOpenEditModal={(task) => {
          handleCloseDetailModal()
          onOpenEditModal(task)
        }}
        onOpenDeleteModal={(task) => {
          handleCloseDetailModal()
          onOpenDeleteModal(task)
        }}
      />
    </>
  )
}

// Individual Task Item Component
function TaskItem({ task, onTaskUpdate, onOpenDeleteModal, onOpenEditModal, onTaskClick }) {
  const [isCompleted, setIsCompleted] = useState(task.status === 'COMPLETED')
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleComplete = async (e) => {
    e.stopPropagation() // Prevent triggering the task click
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
  const isOverdue = (() => {
    // Handle both date-only and datetime tasks
    let taskDate = null;

    if (task.hasDueTime && task.dueDate) {
      // Datetime task - check against exact time
      taskDate = new Date(task.dueDate);
    } else if (task.dueDateDay) {
      // Date-only task - check against end of day
      const [year, month, day] = task.dueDateDay.split('-').map(Number);
      taskDate = new Date(year, month - 1, day);
      taskDate.setHours(23, 59, 59, 999); // End of day
    }

    return taskDate && task.status !== 'COMPLETED' && taskDate < new Date();
  })();

  const handleDropdownClick = (e) => {
    e.stopPropagation() // Prevent triggering the task click
  }

  return (
    <div
      className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${isCompleted ? 'opacity-75' : ''}`}
      onClick={() => onTaskClick(task)}
    >
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

            <div onClick={handleDropdownClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-2 sm:ml-4 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white rounded-lg shadow-lg border border-gray-100 p-1">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenEditModal(task)
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-md"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenDeleteModal(task)
                    }}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-md"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
            {(task.dueDate || task.dueDateDay) && (
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${isOverdue
                ? 'text-red-600 bg-red-50'
                : 'text-gray-500 bg-gray-100'
                }`}>
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(task)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}