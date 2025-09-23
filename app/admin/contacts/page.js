'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatDateTime } from '@/lib/dateUtils'
import { Loader2, Mail, User, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react'

const ContactsAdmin = () => {
  const router = useRouter()
  const [contacts, setContacts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchContacts = async () => {
    if (status === 'authenticated') {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/contact')
        if (!response.ok) {
          throw new Error('Failed to fetch contacts')
        }
        const data = await response.json()
        setContacts(data.contactMessages)
      } catch (err) {
        console.error('Error fetching contacts:', err)
        setError('Failed to load contact messages. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const getStatusColor = (contactStatus) => {
    switch (contactStatus) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'READ': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true
    return contact.status === filter
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#784e87]" />
        <p className="ml-3 text-gray-600">Loading contact messages...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-red-600">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">{error}</p>
        <button 
          onClick={fetchContacts} 
          className="mt-4 px-6 py-3 bg-[#784e87] text-white rounded-xl font-semibold hover:bg-[#6b4476] transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          
          {/* Status Filter */}
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
          >
            <option value="all">All Messages</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-800 mb-3">No Contact Messages</h2>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "No contact messages have been received yet." 
                : `No ${filter.toLowerCase().replace('_', ' ')} messages found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#784e87]/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[#784e87]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-gray-600 text-sm">{contact.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                    {contact.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-800 leading-relaxed">{contact.message}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Received: {formatDateTime(contact.createdAt)}</span>
                  </div>
                  {contact.user && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Authenticated User</span>
                    </div>
                  )}
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

export default ContactsAdmin
