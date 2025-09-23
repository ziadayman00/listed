'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatDateTime } from '@/lib/dateUtils'
import { 
  Users, 
  Shield, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  UserPlus,
  Loader2
} from 'lucide-react'

const AdminManagement = () => {
  const [adminUsers, setAdminUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentAdmin, setCurrentAdmin] = useState(null)

  useEffect(() => {
    fetchAdminUsers()
    checkCurrentAdmin()
  }, [])

  const checkCurrentAdmin = async () => {
    try {
      const response = await fetch('/api/admin/auth/session')
      if (response.ok) {
        const data = await response.json()
        setCurrentAdmin(data.admin)
      }
    } catch (error) {
      console.error('Error checking current admin:', error)
    }
  }

  const fetchAdminUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/admins')
      if (response.ok) {
        const data = await response.json()
        setAdminUsers(data.adminUsers)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch admin users:', errorData.error)
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId, email) => {
    if (!deleteConfirm || deleteConfirm !== adminId) {
      setDeleteConfirm(adminId)
      return
    }

    setIsDeleting(adminId)
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId })
      })

      if (response.ok) {
        // Remove from local state
        setAdminUsers(prev => prev.filter(admin => admin.id !== adminId))
        setDeleteConfirm(null)
        console.log('Admin user deleted successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to delete admin:', errorData.error)
        alert('Failed to delete admin: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Error deleting admin user')
    } finally {
      setIsDeleting(null)
    }
  }

  const getStatusBadge = (admin) => {
    if (!admin.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      )
    }
    
    if (!admin.isEmailVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    )
  }

  // Check if current user is main admin
  const isMainAdmin = currentAdmin?.isMainAdmin

  if (!isMainAdmin) {
    return (
      <AdminLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              Only the main admin can access admin user management.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#784e87]" />
          <p className="ml-3 text-gray-600">Loading admin users...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
              <p className="text-gray-600 mt-2">
                Manage admin users and their access to the dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <UserPlus className="w-4 h-4" />
              <span>Auto-registration with admin password</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-[#784e87]" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Admins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {adminUsers.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Admins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {adminUsers.filter(admin => admin.isActive && admin.isEmailVerified).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Main Admins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {adminUsers.filter(admin => admin.isMainAdmin).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Admin Users</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-[#784e87] flex items-center justify-center">
                            {admin.isMainAdmin ? (
                              <Crown className="h-5 w-5 text-white" />
                            ) : (
                              <Shield className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {admin.isMainAdmin ? 'Main Admin' : 'Admin'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(admin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(admin.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!admin.isMainAdmin && admin.id !== currentAdmin?.id && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          disabled={isDeleting === admin.id}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors ${
                            deleteConfirm === admin.id
                              ? 'text-white bg-red-600 hover:bg-red-700'
                              : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                          } disabled:opacity-50`}
                        >
                          {isDeleting === admin.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          {deleteConfirm === admin.id ? 'Confirm Delete' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserPlus className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How Admin Registration Works
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Any user can become an admin by using the correct admin password</li>
                  <li>New admins are created automatically when they login with the right password</li>
                  <li>All new admins require email verification before accessing the dashboard</li>
                  <li>Only you (main admin) can delete other admin users</li>
                  <li>Main admin accounts cannot be deleted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminManagement
