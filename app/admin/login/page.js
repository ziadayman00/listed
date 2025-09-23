'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'
import { adminLoginSchema, otpVerificationSchema } from '@/lib/validations/admin'
import { loginAdmin, verifyAdminOtp, checkAdminSession } from '@/lib/utils/api'

const AdminLogin = () => {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: login, 2: otp verification
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [devOtp, setDevOtp] = useState('') // For development

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // OTP verification form
  const otpForm = useForm({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      email: '',
      otp: ''
    }
  })

  // Check if already authenticated
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      const result = await checkAdminSession()
      if (result.ok && result.data.authenticated) {
        router.push('/admin')
      }
    } catch (error) {
      console.log('No existing admin session')
    }
  }

  const handleLogin = async (data) => {
    setIsLoading(true)
    loginForm.clearErrors()

    try {
      const result = await loginAdmin(data)

      if (result.ok) {
        setUserEmail(data.email)
        setStep(2) // Move to OTP verification step
        
        // Set email for OTP form
        otpForm.setValue('email', data.email)
        
        // In development, show the OTP
        if (result.data.devCode) {
          setDevOtp(result.data.devCode)
        }
        
        loginForm.reset()
      } else {
        // Handle validation errors
        if (result.data.field) {
          loginForm.setError(result.data.field, {
            type: 'server',
            message: result.data.error
          })
        } else {
          loginForm.setError('root', {
            type: 'server',
            message: result.data.error || 'Login failed'
          })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      loginForm.setError('root', {
        type: 'network',
        message: 'Network error. Please check your connection and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (data) => {
    setIsLoading(true)
    otpForm.clearErrors()

    try {
      const result = await verifyAdminOtp({
        email: data.email,
        otp: data.otp
      })

      if (result.ok) {
        // Success - redirect to admin dashboard
        router.push('/admin')
      } else {
        // Handle validation errors
        if (result.data.field) {
          otpForm.setError(result.data.field, {
            type: 'server',
            message: result.data.error
          })
        } else {
          otpForm.setError('root', {
            type: 'server',
            message: result.data.error || 'Verification failed'
          })
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      otpForm.setError('root', {
        type: 'network',
        message: 'Network error. Please check your connection and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const goBackToLogin = () => {
    setStep(1)
    setUserEmail('')
    setDevOtp('')
    otpForm.reset()
    loginForm.reset()
  }

  const resendOtp = async () => {
    if (!userEmail) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          password: loginForm.getValues('password') || 'resend' // Dummy password for resend
        })
      })

      const result = await response.json()
      if (result.devCode) {
        setDevOtp(result.devCode)
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#784e87] to-[#6b4476] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/whitelogo.png"
              alt="Listed Admin"
              width={80}
              height={80}
              className="w-20 h-20"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/80">
            {step === 1 ? 'Sign in to access the admin panel' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 1 ? (
            /* Step 1: Login Form */
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
              <div className="text-center mb-6">
                <Shield className="w-12 h-12 text-[#784e87] mx-auto mb-2" />
                <h2 className="text-xl font-semibold text-gray-900">Admin Login</h2>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    id="email"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent transition-colors ${
                      loginForm.formState.errors.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="admin@listed.com"
                    disabled={isLoading}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent transition-colors ${
                      loginForm.formState.errors.password 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter admin password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Root Error Message */}
              {loginForm.formState.errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{loginForm.formState.errors.root.message}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#784e87] hover:bg-[#6b4476] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#784e87] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification Form */
            <form onSubmit={otpForm.handleSubmit(handleOtpVerification)} className="space-y-6">
              <div className="text-center mb-6">
                <KeyRound className="w-12 h-12 text-[#784e87] mx-auto mb-2" />
                <h2 className="text-xl font-semibold text-gray-900">Email Verification</h2>
                <p className="text-gray-600 mt-2">
                  We sent a 6-digit OTP to<br />
                  <span className="font-medium">{userEmail}</span>
                </p>
              </div>

              {/* Development OTP Display */}
              {devOtp && process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm text-center">
                  <strong>Development Mode:</strong> Your OTP is <span className="font-mono font-bold text-lg">{devOtp}</span>
                </div>
              )}

              {/* Hidden Email Field */}
              <input {...otpForm.register('email')} type="hidden" />

              {/* OTP Field */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  6-Digit OTP
                </label>
                <input
                  {...otpForm.register('otp')}
                  type="text"
                  id="otp"
                  maxLength="6"
                  className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#784e87] focus:border-transparent transition-colors text-center text-lg font-mono tracking-widest ${
                    otpForm.formState.errors.otp 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="000000"
                  disabled={isLoading}
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {/* Root Error Message */}
              {otpForm.formState.errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{otpForm.formState.errors.root.message}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || !otpForm.watch('otp') || otpForm.watch('otp').length !== 6}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#784e87] hover:bg-[#6b4476] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#784e87] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign in'
                  )}
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={goBackToLogin}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#784e87] disabled:opacity-50 transition-colors"
                  >
                    Back to Login
                  </button>
                  
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-[#784e87] rounded-lg shadow-sm text-sm font-medium text-[#784e87] bg-white hover:bg-[#784e87] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#784e87] disabled:opacity-50 transition-colors"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/60 text-sm">
          <p>Listed Admin Panel • Secure Access</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin