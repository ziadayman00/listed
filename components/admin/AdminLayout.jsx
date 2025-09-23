'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  BarChart3,
  Loader2,
  Shield,
  Crown,
  Home
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminSession, setAdminSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Check admin authentication
  useEffect(() => {
    // Only check auth if we're not already on the login page
    if (pathname !== '/admin/login') {
      checkAdminAuth()
    } else {
      setIsLoading(false)
    }
  }, [pathname])

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setAdminSession(data.admin)
        } else {
          // Not authenticated, replace current history entry with login
          router.replace('/admin/login')
          return
        }
      } else {
        // Session check failed, replace current history entry with login
        router.replace('/admin/login')
        return
      }
    } catch (error) {
      console.error('Admin auth check failed:', error)
      // Only redirect if we're not already on the login page
      if (pathname !== '/admin/login') {
        router.replace('/admin/login')
      }
      return
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST'
      })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect anyway
      router.push('/admin/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Build navigation based on admin role
  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: pathname === '/admin/users'
    },
    {
      name: 'Contact Messages',
      href: '/admin/contacts',
      icon: Mail,
      current: pathname === '/admin/contacts'
    },
    {
      name: 'Support Tickets',
      href: '/admin/support',
      icon: MessageSquare,
      current: pathname === '/admin/support'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname === '/admin/analytics'
    }
  ]

  // Add admin management for main admin only
  const adminOnlyNavigation = adminSession?.isMainAdmin ? [
    {
      name: 'Admin Management',
      href: '/admin/admins',
      icon: Crown,
      current: pathname === '/admin/admins'
    }
  ] : []

  const settingsNavigation = [
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname === '/admin/settings'
    }
  ]

  const navigation = [...baseNavigation, ...adminOnlyNavigation, ...settingsNavigation]

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#784e87] mx-auto mb-4" />
          <p className="text-gray-600">Checking admin authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render admin layout for login page
  if (pathname === '/admin/login') {
    return children
  }

  // Don't render anything if not authenticated (will redirect)
  if (!adminSession) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-3">
              
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? 'bg-[#784e87] text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {item.name}
                  {item.current && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              )
            })}
          </nav>

          {/* Admin info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-[#784e87] rounded-full flex items-center justify-center">
                {adminSession.isMainAdmin ? (
                  <Shield className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {adminSession.email?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminSession.isMainAdmin ? 'Main Admin' : 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminSession.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5 mr-3" />
              )}
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-500">
                  Welcome back, <span className="font-medium text-gray-900">{adminSession?.email || 'Admin'}</span>
                </p>
              </div>
              
              {/* Home Button */}
              <Link 
                href="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-[#784e87] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#784e87]"
                title="Go to Home Page"
              >
                <Home className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
