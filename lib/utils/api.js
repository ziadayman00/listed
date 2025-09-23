// API utility functions for client-side requests

/**
 * Get the correct API base URL based on current environment
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin
  }
  
  // Server-side: use environment variable or default
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

/**
 * Make an API request with proper error handling
 * @param {string} endpoint - API endpoint (e.g., '/api/admin/auth/login')
 * @param {object} options - Fetch options
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }
  
  try {
    const response = await fetch(url, finalOptions)
    
    // Always try to parse JSON response
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      // If JSON parsing fails, create a generic error response
      data = {
        error: response.ok ? 'Invalid response format' : 'Server error',
        status: response.status
      }
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      response
    }
    
  } catch (error) {
    // Handle network errors
    console.error('API Request Error:', error)
    
    return {
      ok: false,
      status: 0,
      data: {
        error: 'Network error. Please check your connection and try again.',
        details: error.message
      },
      networkError: true
    }
  }
}

/**
 * Admin login API call
 * @param {object} credentials - { email, password }
 */
export async function loginAdmin(credentials) {
  return apiRequest('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
}

/**
 * Admin OTP verification API call
 * @param {object} otpData - { email, otp }
 */
export async function verifyAdminOtp(otpData) {
  return apiRequest('/api/admin/auth/verify', {
    method: 'POST',
    body: JSON.stringify(otpData)
  })
}

/**
 * Check admin session API call
 */
export async function checkAdminSession() {
  return apiRequest('/api/admin/auth/session', {
    method: 'GET'
  })
}

/**
 * Admin logout API call
 */
export async function logoutAdmin() {
  return apiRequest('/api/admin/auth/logout', {
    method: 'POST'
  })
}
