'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react'

export default function SupportModal({ isOpen, onClose }) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!session) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      console.log('Submitting support ticket with data:', formData)
      
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Success result:', result)
        setSubmitStatus('success')
        setFormData({ subject: '', description: '', priority: 'MEDIUM' })
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
          setSubmitStatus(null)
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/20 backdrop-blur-md transition-all"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Contact Support
            </h2>
            <p className="text-gray-600">
              {session 
                ? "We're here to help! Describe your issue and we'll get back to you soon."
                : "Please sign in to contact support."
              }
            </p>
          </div>

          {!session ? (
            // Not logged in state
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600 mb-6">
                You need to be signed in to contact support and track your tickets.
              </p>
              <Button 
                onClick={onClose}
                className="bg-[#784e87] hover:bg-[#6b4476] text-white"
              >
                Sign In First
              </Button>
            </div>
          ) : submitStatus === 'success' ? (
            // Success state
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ticket Submitted Successfully!
              </h3>
              <p className="text-gray-600">
                We've received your support request and will respond within 24 hours.
              </p>
            </div>
          ) : (
            // Support form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#784e87] focus:border-transparent transition-colors"
                >
                  <option value="LOW">Low - General question</option>
                  <option value="MEDIUM">Medium - Need assistance</option>
                  <option value="HIGH">High - Important issue</option>
                  <option value="URGENT">Urgent - Critical problem</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Brief description of your issue"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#784e87] focus:border-transparent transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please provide detailed information about your issue..."
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#784e87] focus:border-transparent transition-colors resize-none"
                />
              </div>

              {/* Error state */}
              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">
                    There was an error submitting your ticket. Please try again.
                  </p>
                </div>
              )}

              {/* Submit button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.subject.trim() || !formData.description.trim()}
                  className="flex-1 bg-[#784e87] hover:bg-[#6b4476] text-white h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          {session && submitStatus !== 'success' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                You can view and track your support tickets in your account dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
