'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  CheckSquare, 
  Brain, 
  TrendingUp, 
  User, 
  LogOut, 
  Menu, 
  X,
  Home,
  Plus
} from 'lucide-react'

export default function DashboardLayout({ children, activeView, setActiveView, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navigation = [
    {
      name: 'Overview',
      id: 'overview',
      icon: Home,
      current: activeView === 'overview'
    },
    {
      name: 'Tasks',
      id: 'tasks',
      icon: CheckSquare,
      current: activeView === 'tasks'
    },
    {
      name: 'AI Suggestions',
      id: 'ai-suggestions',
      icon: Brain,
      current: activeView === 'ai-suggestions'
    },
    {
      name: 'Progress',
      id: 'progress',
      icon: TrendingUp,
      current: activeView === 'progress'
    },
    {
      name: 'Profile',
      id: 'profile',
      icon: User,
      current: activeView === 'profile'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Listed" 
                className="h-8 w-auto"
              />
              
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#784e87]/10 rounded-full flex items-center justify-center">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="text-sm font-bold text-[#784e87]">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-[#784e87] text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 w-5 h-5 ${
                    item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* Quick Add Button */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center justify-center px-4 py-3 bg-[#784e87]/10 text-[#784e87] rounded-xl hover:bg-[#784e87]/20 transition-colors font-medium">
              <Plus className="w-5 h-5 mr-2" />
              Quick Add Task
            </button>
          </div>

          {/* Logout */}
          <div className="p-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full group flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <LogOut className="mr-3 w-5 h-5 text-gray-400 group-hover:text-red-500" />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="sidebar-toggle p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Listed" 
                className="h-6 w-auto"
              />
              <span className="text-lg font-bold text-gray-900">Listed</span>
            </Link>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
