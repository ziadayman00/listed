'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Target,
  Sparkles,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react'

export default function AISuggestions({ preview = false }) {
  const [suggestions, setSuggestions] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(new Set())
  const [rejectedSuggestions, setRejectedSuggestions] = useState(new Set())
  const [isFallback, setIsFallback] = useState(false)

  // Fetch suggestions from API
  const fetchSuggestions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await fetch('/api/ai/suggestions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setSuggestions(data.suggestions || [])
      setAnalytics(data.analytics || {})
      setIsFallback(data.fallback || false)

    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err)
      setError('Failed to load AI suggestions. Please try again.')
      setSuggestions([]) // Clear suggestions on error
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Handle suggestion actions (accept/reject)
  const handleSuggestionAction = async (action, suggestion) => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          suggestionId: suggestion.id,
          suggestionData: suggestion
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (action === 'accept') {
        setAcceptedSuggestions(prev => new Set([...prev, suggestion.id]))
        
        // Show success message if a task was created
        if (result.taskId) {
          // You could show a toast notification here
          console.log('Task created from suggestion:', result.taskId)
        }
      } else {
        setRejectedSuggestions(prev => new Set([...prev, suggestion.id]))
      }

    } catch (err) {
      console.error('Failed to process suggestion action:', err)
      // You could show an error toast here
    }
  }

  const handleAccept = (suggestion) => {
    handleSuggestionAction('accept', suggestion)
  }

  const handleReject = (suggestion) => {
    handleSuggestionAction('reject', suggestion)
  }

  const handleRefresh = () => {
    fetchSuggestions(true)
  }

  // Load suggestions on mount
  useEffect(() => {
    fetchSuggestions()
  }, [])

  // Filter out processed suggestions for display
  const displaySuggestions = suggestions.filter(s => 
    !acceptedSuggestions.has(s.id) && !rejectedSuggestions.has(s.id)
  )

  const previewSuggestions = preview ? displaySuggestions.slice(0, 2) : displaySuggestions

  const getTypeIcon = (type) => {
    switch (type) {
      case 'task_creation':
        return <Plus className="w-5 h-5 text-blue-500" />
      case 'optimization':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'deadline_optimization':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'break_reminder':
        return <Target className="w-5 h-5 text-purple-500" />
      case 'skill_development':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />
      default:
        return <Sparkles className="w-5 h-5 text-[#784e87]" />
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'task_creation':
        return 'New Task'
      case 'optimization':
        return 'Optimization'
      case 'deadline_optimization':
        return 'Schedule'
      case 'break_reminder':
        return 'Wellness'
      case 'skill_development':
        return 'Learning'
      default:
        return 'Suggestion'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100'
    if (confidence >= 75) return 'text-blue-600 bg-blue-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'text-purple-600 bg-purple-100'
      case 'medium':
        return 'text-blue-600 bg-blue-100'
      case 'low':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-3 sm:p-6 border-b border-gray-100">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#784e87]/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-[#784e87]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                {preview ? 'AI Suggestions' : 'AI-Powered Suggestions'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 leading-tight">
                {preview ? 'Smart recommendations for you' : 'Personalized recommendations to boost your productivity'}
              </p>
              {isFallback && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Using fallback suggestions</span>
                </p>
              )}
            </div>
          </div>
          
          {!preview && (
            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
              {/* Analytics Summary - Mobile optimized */}
              {Object.keys(analytics).length > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 leading-tight">
                    {analytics.completionRate?.toFixed(0)}% completion
                  </div>
                  <div className="text-xs text-gray-500 leading-tight">
                    {analytics.totalTasks} tasks this week
                  </div>
                </div>
              )}
              
              {/* Refresh Button - Mobile friendly */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center px-3 py-2 sm:px-4 text-[#784e87] border border-[#784e87]/20 rounded-lg hover:bg-[#784e87]/5 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
                <span className="sm:hidden">
                  {isRefreshing ? '...' : 'Refresh'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#784e87] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your productivity patterns...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load suggestions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchSuggestions()}
            className="inline-flex items-center px-4 py-2 bg-[#784e87] text-white rounded-lg hover:bg-[#6b4476] transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && !error && (
        <div className="divide-y divide-gray-100">
          {previewSuggestions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#784e87]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-[#784e87]" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
              <p className="text-gray-600 mb-4">
                Complete a few tasks and I'll start providing personalized suggestions to help you stay productive.
              </p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 bg-[#784e87] text-white rounded-lg hover:bg-[#6b4476] transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check for Suggestions
              </button>
            </div>
          ) : (
            previewSuggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion)}
                onReject={() => handleReject(suggestion)}
                getTypeIcon={getTypeIcon}
                getTypeLabel={getTypeLabel}
                getConfidenceColor={getConfidenceColor}
                getPriorityColor={getPriorityColor}
                getImpactColor={getImpactColor}
              />
            ))
          )}
        </div>
      )}

      {/* Show processed suggestions summary */}
      {(acceptedSuggestions.size > 0 || rejectedSuggestions.size > 0) && !preview && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-6 text-sm">
            {acceptedSuggestions.size > 0 && (
              <div className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-1" />
                {acceptedSuggestions.size} accepted
              </div>
            )}
            {rejectedSuggestions.size > 0 && (
              <div className="flex items-center text-gray-600">
                <X className="w-4 h-4 mr-1" />
                {rejectedSuggestions.size} dismissed
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview footer */}
      {preview && suggestions.length > 2 && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button className="text-[#784e87] hover:text-[#6b4476] font-medium">
            View all {suggestions.length} suggestions →
          </button>
        </div>
      )}

      {/* AI Insights Footer */}
      {!preview && !isLoading && (
        <div className="p-6 bg-gradient-to-r from-[#784e87]/5 to-[#b8a9c0]/5 border-t border-gray-100">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-[#784e87] mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">AI Learning</h4>
              <p className="text-xs text-gray-600">
                These suggestions improve as you use Listed. Accept or reject suggestions to help me learn your preferences and provide better recommendations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual Suggestion Item Component
function SuggestionItem({ 
  suggestion, 
  onAccept, 
  onReject,
  getTypeIcon,
  getTypeLabel,
  getConfidenceColor,
  getPriorityColor,
  getImpactColor
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      await onAccept()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Type Icon */}
        <div className="mt-1">
          {getTypeIcon(suggestion.type)}
        </div>

        {/* Suggestion Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {suggestion.title}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {getTypeLabel(suggestion.type)}
                </span>
                {suggestion.category && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                    {suggestion.category}
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Dismiss suggestion"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                title="Accept suggestion"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {suggestion.description}
          </p>

          {/* Suggestion Meta */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            {/* Confidence */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
              {suggestion.confidence}% confident
            </span>

            {/* Priority */}
            {suggestion.priority && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                {suggestion.priority} priority
              </span>
            )}

            {/* Impact */}
            {suggestion.impact && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                {suggestion.impact} impact
              </span>
            )}

            {/* Estimated Time */}
            {suggestion.estimatedTime && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {suggestion.estimatedTime}
              </span>
            )}

            {/* Suggested Date */}
            {suggestion.suggestedDate && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {new Date(suggestion.suggestedDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Show Details Toggle */}
          {suggestion.reasoning && (
            <>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-[#784e87] hover:text-[#6b4476] font-medium"
              >
                {showDetails ? 'Hide details' : 'Why this suggestion?'}
              </button>

              {/* Details */}
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">AI Reasoning:</span> {suggestion.reasoning}
                  </p>
                  {suggestion.createdAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Generated:</span> {new Date(suggestion.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}