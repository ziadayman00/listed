'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatNumber, formatDateTime } from '@/lib/dateUtils'
import { 
  Users, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogIn,
  LogOut,
  UserPlus,
  User
} from 'lucide-react'

// Helper function to get icon component from string
const getIconComponent = (iconName) => {
  const icons = {
    Users,
    Mail,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    Clock,
    LogIn,
    LogOut,
    UserPlus,
    User
  }
  return icons[iconName] || Clock
}

// Helper function to get time ago string
const getTimeAgo = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDateTime(dateString)
}

const AdminDashboard = () => {
  const router = useRouter()
  const [stats, setStats] = useState({
    users: { total: 0, new: 0 },
    contacts: { total: 0, new: 0 },
    support: { total: 0, open: 0 },
    growth: { percentage: 0, trend: 'up' }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const [lastFetch, setLastFetch] = useState(null)

  useEffect(() => {
    // Only fetch data if we haven't fetched in the last 30 seconds
    const now = Date.now()
    if (!lastFetch || (now - lastFetch) > 30000) {
      fetchDashboardData()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // No dependencies needed - AdminLayout handles auth

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/dashboard')
      
      if (response.ok) {
        const data = await response.json()
        
        setStats(data.stats)
        setRecentActivity(data.recentActivities)
        setLastFetch(Date.now()) // Update last fetch time
        
        console.log('Dashboard data loaded:', data)
        console.log('Recent activities received:', data.recentActivities)
        console.log('Recent activities count:', data.recentActivities?.length)
      } else {
        console.error('Failed to fetch dashboard data')
        // Fallback to mock data if API fails
        setStats({
          users: { total: 0, new: 0, growth: 0 },
          contacts: { total: 0, new: 0 },
          support: { total: 0, open: 0, new: 0 },
          growth: { percentage: 0, trend: 'up' }
        })
        setRecentActivity([])
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to empty data if API fails
      setStats({
        users: { total: 0, new: 0, growth: 0 },
        contacts: { total: 0, new: 0 },
        support: { total: 0, open: 0, new: 0 },
        growth: { percentage: 0, trend: 'up' }
      })
      setRecentActivity([])
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Users',
      value: formatNumber(stats.users.total),
      change: `+${stats.users.new} new`,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      href: '/admin/users'
    },
    {
      name: 'Contact Messages',
      value: formatNumber(stats.contacts.total),
      change: `${stats.contacts.new} unread`,
      icon: Mail,
      color: 'text-green-600 bg-green-100',
      href: '/admin/contacts'
    },
    {
      name: 'Support Tickets',
      value: formatNumber(stats.support.total),
      change: `${stats.support.open} open`,
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-100',
      href: '/admin/support'
    },
    {
      name: 'Growth Rate',
      value: `${stats.growth.percentage}%`,
      change: 'vs last month',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-100',
      href: '/admin/analytics'
    }
  ]

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#784e87]" />
          <p className="ml-3 text-gray-600">Loading dashboard...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome to the Listed admin panel. Here's an overview of your application.
                {lastFetch && (
                  <span className="text-sm text-gray-500 block mt-1">
                    Last updated {getTimeAgo(new Date(lastFetch).toISOString())}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="px-4 py-2 bg-[#784e87] text-white rounded-lg hover:bg-[#6b4476] disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.name}
                onClick={() => card.href && router.push(card.href)}
                className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
                  card.href 
                    ? 'hover:shadow-lg hover:border-[#784e87] cursor-pointer transform hover:-translate-y-1' 
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} ${
                    card.href ? 'group-hover:scale-110 transition-transform duration-200' : ''
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
                  Debug: {recentActivity.length} activities in state
                </div>
              )}
              
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => {
                  const Icon = getIconComponent(activity.icon)
                  const timeAgo = getTimeAgo(activity.time)
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                          {activity.metadata?.provider && activity.type === 'user_activity' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {activity.metadata.provider}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                        {activity.metadata?.email && activity.type === 'user_activity' && (
                          <p className="text-xs text-gray-400 mt-0.5">{activity.metadata.email}</p>
                        )}
                      </div>
                      {activity.metadata?.image && activity.type === 'user_activity' && (
                        <img 
                          src={activity.metadata.image} 
                          alt="User avatar" 
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/admin/users')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#784e87] transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-[#784e87] group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium text-gray-900">Manage Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{formatNumber(stats.users.total)} users</span>
                  <div className="w-2 h-2 bg-[#784e87] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/admin/contacts')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#784e87] transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-[#784e87] group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium text-gray-900">Contact Messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{stats.contacts.new} new</span>
                  <div className="w-2 h-2 bg-[#784e87] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/admin/support')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-[#784e87] transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-[#784e87] group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium text-gray-900">Support Tickets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{stats.support.open} open</span>
                  <div className="w-2 h-2 bg-[#784e87] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-500">Operational</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">API Services</p>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-900">Email Service</p>
                <p className="text-sm text-gray-500">Minor delays</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
