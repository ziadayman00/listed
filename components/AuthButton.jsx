'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import AuthModal from '@/components/AuthModal'

export default function AuthButton({ isMobile = false }) {
  const { data: session, status } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className={`${isMobile ? 'w-full space-y-3' : 'flex items-center space-x-3'}`}>
        <div className={`bg-gray-200 animate-pulse rounded ${isMobile ? 'h-12 w-full' : 'h-9 w-20'}`}></div>
        {!isMobile && <div className="bg-gray-200 animate-pulse rounded h-9 w-24"></div>}
      </div>
    )
  }

  if (session) {
    if (isMobile) {
      // Mobile authenticated view
      return (
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="relative">
              <Image
                src={session.user.image || '/default-avatar.svg'}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
          </Link>
          <Button 
            onClick={() => signOut()}
            variant="outline"
            size="default"
            className="w-full h-12 text-base font-medium border-2 border-red-200 hover:border-red-300 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )
    }

    // Desktop authenticated view
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <Image
            src={session.user.image || '/default-avatar.png'}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
            <Link
              href="/dashboard"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <User className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            <button
              onClick={() => {
                setIsDropdownOpen(false)
                signOut()
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    )
  }

  // Not authenticated - show login/register buttons
  if (isMobile) {
    return (
      <>
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <Button 
            onClick={() => setIsAuthModalOpen(true)}
            variant="outline" 
            size="default"
            className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:border-[#784e87] hover:text-[#784e87] transition-all duration-200"
          >
            Login
          </Button>
          <Button 
            onClick={() => setIsAuthModalOpen(true)}
            size="default"
            className="w-full h-12 text-base font-medium bg-[#784e87] hover:bg-[#6b4476] text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Register
          </Button>
        </div>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </>
    )
  }

  // Desktop not authenticated
  return (
    <>
      <div className="flex items-center space-x-3">
        <Button 
          onClick={() => setIsAuthModalOpen(true)}
          variant="outline" 
          size="sm"
        >
          Login
        </Button>
        <Button 
          onClick={() => setIsAuthModalOpen(true)}
          size="sm" 
          className="bg-[#784e87] hover:bg-[#6b4476] text-white"
        >
          Register
        </Button>
      </div>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}
