'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Clock, AlertCircle, Brain, TrendingUp, Calendar, Home, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TasksOverview from '@/components/dashboard/TasksOverview'
import AISuggestions from '@/components/dashboard/AISuggestions'
import ProgressStats from '@/components/dashboard/ProgressStats'
import AddTaskModal from '@/components/dashboard/AddTaskModal'
import AIChat from '@/components/dashboard/AIChat'
import Link from 'next/link'
import DeleteConfirmationModal from '@/components/dashboard/DeleteConfirmationModal'
import DeletedTasksOverview from '@/components/dashboard/DeletedTasksOverview'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeView, setActiveView] = useState('tasks')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false) // New state for edit modal
  const [taskToEdit, setTaskToEdit] = useState(null) // New state to store task being edited
  const [tasks, setTasks] = useState([]) // Store created tasks
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0)
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/')
      return
    }

    // Fetch dashboard stats
    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats({
        total: data.overview.totalTasks,
        completed: data.overview.completedTasks,
        pending: data.overview.pendingTasks + data.overview.inProgressTasks,
        overdue: data.overview.overdueTasks
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#784e87] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  // Handle task creation from AI Chat and AddTaskModal
  const handleTaskCreate = (taskData) => {
    // Refresh stats when a new task is created
    fetchStats()
    
    // Trigger a refresh of the tasks list by setting a refresh key
    setTasksRefreshKey(prev => prev + 1)
    
    // Show success message or update UI as needed
    console.log('Task created:', taskData)
  }

  // Handle task update from EditTaskModal
  const handleTaskUpdate = (updatedTaskData) => {
    // Refresh stats when a task is updated
    fetchStats()
    
    // Trigger a refresh of the tasks list
    setTasksRefreshKey(prev => prev + 1)
    
    // Close the edit modal and clear the task to edit
    setShowEditTaskModal(false)
    setTaskToEdit(null)
    
    // Show success message or update UI as needed
    console.log('Task updated:', updatedTaskData)
  }

  // Handle opening edit modal
  const handleOpenEditModal = (task) => {
    setTaskToEdit(task)
    setShowEditTaskModal(true)
  }

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setShowEditTaskModal(false)
    setTaskToEdit(null)
  }

  const handleOpenDeleteModal = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirmationModal(true);
  };  

  const handleDeleteTask = async (taskId, deleteForever) => {
    try {
      const endpoint = deleteForever ? `/api/deleted-tasks/${taskId}` : `/api/tasks/${taskId}`;
      const method = deleteForever ? 'DELETE' : 'DELETE'; // Soft delete is also DELETE on /api/tasks/[id]

      let response;
      if (deleteForever) {
        // For permanent delete, the deletedTask ID is passed
        response = await fetch(endpoint, { method: 'DELETE' });
      } else {
        // For soft delete, the original task ID is passed
        response = await fetch(endpoint, { method: 'DELETE' });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      // Refresh relevant data after successful deletion
      fetchStats();
      setTasksRefreshKey(prev => prev + 1); // Refresh tasks list
      // Close modal
      setShowDeleteConfirmationModal(false);
      setTaskToDelete(null);

    } catch (error) {
      console.error('Error deleting task:', error);
      // Optionally show an error message to the user
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-[#784e87] rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Hi, {session.user?.name?.split(' ')[0] || 'there'}!
                </h1>
                <p className="text-xs text-gray-500">Let&apos;s get things done</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Home Button */}
              <Link href="/">
                <Button
                  variant="outline"
                  className="p-2 h-10 w-10"
                >
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              
              {/* Prominent Add Task Button */}
              <Button
                onClick={() => setShowAddTaskModal(true)}
                className="bg-[#784e87] hover:bg-[#6b4476] text-white px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <div className="text-xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.total
                  )}
                </div>
              </div>
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Done</p>
                <div className="text-xl font-bold text-green-600">
                  {isLoadingStats ? (
                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.completed
                  )}
                </div>
              </div>
              <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Active</p>
                <div className="text-xl font-bold text-blue-600">
                  {isLoadingStats ? (
                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.pending
                  )}
                </div>
              </div>
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Overdue</p>
                <div className="text-xl font-bold text-red-600">
                  {isLoadingStats ? (
                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.overdue
                  )}
                </div>
              </div>
              <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex overflow-x-auto">
            {[
              { id: 'tasks', label: 'My Tasks', icon: CheckCircle },
              { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare },
              { id: 'ai-suggestions', label: 'AI Help', icon: Brain },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'trash', label: 'Trash', icon: Trash2 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeView === tab.id
                      ? 'border-[#784e87] text-[#784e87] bg-[#784e87]/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeView === 'tasks' && (
            <TasksOverview 
              key={tasksRefreshKey} 
              tasksRefreshKey={tasksRefreshKey} 
              onOpenDeleteModal={handleOpenDeleteModal}
              onOpenEditModal={handleOpenEditModal} // Pass edit handler to TasksOverview
            />
          )}
          {activeView === 'ai-chat' && <AIChat onTaskCreate={handleTaskCreate} />}
          {activeView === 'ai-suggestions' && <AISuggestions />}
          {activeView === 'progress' && <ProgressStats />}
          {activeView === 'trash' && (
            <DeletedTasksOverview 
              key={tasksRefreshKey} 
              onTaskRestoredOrPermanentlyDeleted={setTasksRefreshKey} 
            />
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal 
          onClose={() => setShowAddTaskModal(false)} 
          onTaskCreate={handleTaskCreate}
          editMode={false}
          taskToEdit={null}
        />
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && taskToEdit && (
        <AddTaskModal 
          onClose={handleCloseEditModal} 
          onTaskCreate={handleTaskCreate} // For consistency, though won't be used in edit mode
          onTaskUpdate={handleTaskUpdate} // New prop for handling updates
          editMode={true}
          taskToEdit={taskToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmationModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmationModal}
          onClose={() => setShowDeleteConfirmationModal(false)}
          onConfirmDelete={handleDeleteTask}
          task={taskToDelete}
        />
      )}

      {/* Floating Add Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Button
          onClick={() => setShowAddTaskModal(true)}
          className="bg-[#784e87] hover:bg-[#6b4476] text-white w-14 h-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}