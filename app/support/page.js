'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import SupportModal from '@/components/SupportModal'
import { Plus, Clock, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'

const statusIcons = {
  OPEN: Clock,
  IN_PROGRESS: AlertCircle,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle
}

const statusColors = {
  OPEN: 'text-blue-600 bg-blue-100',
  IN_PROGRESS: 'text-orange-600 bg-orange-100',
  RESOLVED: 'text-green-600 bg-green-100',
  CLOSED: 'text-gray-600 bg-gray-100'
}

const priorityColors = {
  LOW: 'text-gray-600 bg-gray-100',
  MEDIUM: 'text-blue-600 bg-blue-100',
  HIGH: 'text-orange-600 bg-orange-100',
  URGENT: 'text-red-600 bg-red-100'
}

export default function SupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/')
      return
    }

    fetchTickets()
  }, [session, status, router])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/support/tickets')
      
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      } else {
        setError('Failed to load support tickets')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setError('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#784e87]"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Support Tickets
              </h1>
              <p className="text-gray-600">
                Track your support requests and get help with Listed
              </p>
            </div>
            <Button
              onClick={() => setIsSupportModalOpen(true)}
              className="mt-4 sm:mt-0 bg-[#784e87] hover:bg-[#6b4476] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Support Tickets
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any support requests yet.
            </p>
            <Button
              onClick={() => setIsSupportModalOpen(true)}
              className="bg-[#784e87] hover:bg-[#6b4476] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const StatusIcon = statusIcons[ticket.status]
              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                        <span>•</span>
                        <span>{ticket.messages?.length || 0} messages</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Support Modal */}
        <SupportModal 
          isOpen={isSupportModalOpen} 
          onClose={() => {
            setIsSupportModalOpen(false)
            fetchTickets() // Refresh tickets after creating new one
          }} 
        />
      </div>
    </div>
  )
}
