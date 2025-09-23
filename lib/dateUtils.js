// Utility functions for safe date formatting that avoid hydration mismatches

export const formatDate = (dateString, options = {}) => {
  if (typeof window === 'undefined') {
    // Server-side: return a simple fallback
    return new Date(dateString).toISOString().split('T')[0] // YYYY-MM-DD format
  }
  
  // Client-side: use full locale formatting
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  })
}

export const formatDateTime = (dateString, options = {}) => {
  if (typeof window === 'undefined') {
    // Server-side: return a simple fallback
    return new Date(dateString).toISOString().replace('T', ' ').split('.')[0] // YYYY-MM-DD HH:mm:ss
  }
  
  // Client-side: use full locale formatting
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  })
}

export const formatNumber = (number) => {
  if (typeof window === 'undefined') {
    // Server-side: return simple number
    return number.toString()
  }
  
  // Client-side: use locale formatting
  return number.toLocaleString()
}
