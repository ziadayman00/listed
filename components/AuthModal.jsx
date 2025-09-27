'use client'

import { useState, useEffect } from 'react'
import { getProviders, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { X } from 'lucide-react'

// Better SVG icons for providers
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#181717">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

export default function AuthModal({ isOpen, onClose }) {
  const [providers, setProviders] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const setUpProviders = async () => {
      const response = await getProviders()
      setProviders(response)
    }
    if (isOpen) {
      setUpProviders()
    }
  }, [isOpen])

  const handleSignIn = async (providerId) => {
    setIsLoading(true)
    try {
      await signIn(providerId, { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
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
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Listed
            </h2>
            <p className="text-gray-600">
              Sign in to access your AI-powered task manager
            </p>
          </div>

          {/* Sign-in options */}
          <div className="space-y-3">
            {!providers ? (
              // Loading state
              <>
                <div className="w-full h-12 bg-gray-200 animate-pulse rounded-xl"></div>
                <div className="w-full h-12 bg-gray-200 animate-pulse rounded-xl"></div>
              </>
            ) : (
              Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  onClick={() => handleSignIn(provider.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:border-[#784e87] hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {provider.id === 'google' && <GoogleIcon />}
                  {provider.id === 'github' && <GitHubIcon />}
                  <span>
                    {isLoading ? 'Signing in...' : `Continue with ${provider.name}`}
                  </span>
                </Button>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Features preview */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Join thousands of users who love Listed for AI-powered productivity
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <button className="text-[#784e87] hover:underline">
                Terms
              </button>{' '}
              and{' '}
              <button className="text-[#784e87] hover:underline">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
