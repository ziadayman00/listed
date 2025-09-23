'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatDate, formatDateTime } from '@/lib/dateUtils'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Loader2,
  MoreVertical,
  Calendar
} from 'lucide-react'

const SupportAdmin = () => {
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTickets = async () => {
    if (status === 'authenticated') {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/support/tickets')
        if (!response.ok) {
          throw new Error('Failed to fetch tickets')
        }
        const data = await response.json()
        setTickets(data.tickets)
      } catch (err) {
        console.error('Error fetching tickets:', err)
        setError('Failed to load support tickets. Please try again later.')
        // Use mock data for demonstration
        setTickets([
          {
            id: '1',
            subject: 'Unable to sync tasks across devices',
            description: 'My tasks are not syncing properly between my phone and laptop. Can you help?',
            status: 'OPEN',
            priority: 'HIGH',
            createdAt: '2024-03-15T10:30:00Z',
            updatedAt: '2024-03-15T10:30:00Z',
            user: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            messages: [
              { id: '1', content: 'Initial message', isFromUser: true }
            ]
          },
          {
            id: '2',
            subject: 'Feature request: Dark mode',
            description: 'Would love to see a dark mode option in the app settings.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            createdAt: '2024-03-14T14:20:00Z',
            updatedAt: '2024-03-15T09:15:00Z',
            user: {
              name: 'Jane Smith',
              email: 'jane@example.com'
            },
            messages: [
              { id: '1', content: 'Initial message', isFromUser: true },
              { id: '2', content: 'We are working on this', isFromUser: false }
            ]
          },
          {
            id: '3',
            subject: 'Billing question',
            description: 'I was charged twice this month. Please check my account.',
            status: 'RESOLVED',
            priority: 'URGENT',
            createdAt: '2024-03-13T16:45:00Z',
            updatedAt: '2024-03-14T10:30:00Z',
            resolvedAt: '2024-03-14T10:30:00Z',
            user: {
              name: 'Mike Johnson',
              email: 'mike@example.com'
            },
            messages: [
              { id: '1', content: 'Initial message', isFromUser: true },
              { id: '2', content: 'Issue resolved and refunded', isFromUser: false }
            ]
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const getStatusColor = (ticketStatus) => {
    switch (ticketStatus) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-green-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'HIGH': return 'bg-orange-500'
      case 'URGENT': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filter === 'all') return matchesSearch
    return matchesSearch && ticket.status === filter
  })

  const getStats = () => {
    const total = tickets.length
    const open = tickets.filter(t => t.status === 'OPEN').length
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length
    const resolved = tickets.filter(t => t.status === 'RESOLVED').length
    
    return { total, open, inProgress, resolved }
  }

  const stats = getStats()

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#784e87]" />
          <p className="ml-3 text-gray-600">Loading support tickets...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">{error}</p>
          <button 
            onClick={fetchTickets} 
            className="mt-4 px-6 py-3 bg-[#784e87] text-white rounded-xl font-semibold hover:bg-[#6b4476] transition-colors duration-300"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-2">
              Manage and respond to customer support requests.
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                  <p className="text-sm text-gray-600">Open</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tickets by subject, user name, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Tickets</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tickets list */}
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-800 mb-3">No Support Tickets</h2>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "No support tickets have been submitted yet." 
                  : `No ${filter.toLowerCase().replace('_', ' ')} tickets found.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 bg-[#784e87]/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#784e87]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-gray-600 text-sm mb-2">
                          by <span className="font-medium">{ticket.user?.name}</span> ({ticket.user?.email})
                        </p>
                        <p className="text-gray-700 text-sm line-clamp-2">{ticket.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`} 
                           title={`${ticket.priority} Priority`}></div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <button className="p-1 rounded-md text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{ticket.messages?.length || 0} Messages</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated: {formatDateTime(ticket.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default SupportAdmin
