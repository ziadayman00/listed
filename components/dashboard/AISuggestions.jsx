'use client'

import { useState } from 'react'
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
  X
} from 'lucide-react'

export default function AISuggestions({ preview = false }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState(new Set())
  const [rejectedSuggestions, setRejectedSuggestions] = useState(new Set())

  // Sample AI suggestions data
  const suggestions = [
    {
      id: 1,
      type: 'task_creation',
      title: 'Schedule follow-up meeting',
      description: 'Based on your completed project proposal, I suggest scheduling a follow-up meeting to discuss next steps.',
      confidence: 85,
      reasoning: 'You completed "Complete project proposal" yesterday. Teams typically schedule follow-ups within 2-3 days.',
      category: 'Work',
      priority: 'medium',
      estimatedTime: '30 min',
      suggestedDate: '2024-01-17'
    },
    {
      id: 2,
      type: 'optimization',
      title: 'Batch similar tasks',
      description: 'Group your documentation tasks together to improve focus and reduce context switching.',
      confidence: 92,
      reasoning: 'You have 3 documentation-related tasks. Research shows 23% productivity gain from task batching.',
      category: 'Productivity',
      priority: 'low',
      estimatedTime: '5 min setup',
      impact: 'High'
    },
    {
      id: 3,
      type: 'deadline_optimization',
      title: 'Reschedule presentation prep',
      description: 'Move presentation preparation earlier to avoid conflicts with your high-priority tasks.',
      confidence: 78,
      reasoning: 'You have overlapping high-priority tasks on Jan 16. Moving this task prevents last-minute stress.',
      category: 'Planning',
      priority: 'high',
      estimatedTime: '2 hours',
      suggestedDate: '2024-01-15'
    },
    {
      id: 4,
      type: 'break_reminder',
      title: 'Take a productivity break',
      description: 'You\'ve been working on tasks for 2.5 hours. A 15-minute break can boost your focus.',
      confidence: 95,
      reasoning: 'Studies show productivity decreases after 90-120 minutes of focused work without breaks.',
      category: 'Wellness',
      priority: 'medium',
      estimatedTime: '15 min',
      impact: 'Medium'
    },
    {
      id: 5,
      type: 'skill_development',
      title: 'Learn about project management',
      description: 'Based on your tasks, learning project management skills could improve your efficiency by 30%.',
      confidence: 73,
      reasoning: 'You frequently create project-related tasks. PM skills align with your work patterns.',
      category: 'Learning',
      priority: 'low',
      estimatedTime: '1 hour',
      impact: 'High'
    }
  ]

  const displaySuggestions = preview ? suggestions.slice(0, 2) : suggestions

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const handleAccept = (suggestionId) => {
    setAcceptedSuggestions(prev => new Set([...prev, suggestionId]))
    // Here you would implement the suggestion (create task, etc.)
  }

  const handleReject = (suggestionId) => {
    setRejectedSuggestions(prev => new Set([...prev, suggestionId]))
    // Here you would send feedback to improve AI suggestions
  }

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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100'
    if (confidence >= 75) return 'text-blue-600 bg-blue-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#784e87]/10 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#784e87]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {preview ? 'AI Suggestions' : 'AI-Powered Suggestions'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {preview ? 'Smart recommendations for you' : 'Personalized recommendations to boost your productivity'}
              </p>
            </div>
          </div>
          {!preview && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 text-[#784e87] border border-[#784e87]/20 rounded-lg hover:bg-[#784e87]/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-gray-100">
        {displaySuggestions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#784e87]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-[#784e87]" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions yet</h3>
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
          displaySuggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAccept}
              onReject={handleReject}
              isAccepted={acceptedSuggestions.has(suggestion.id)}
              isRejected={rejectedSuggestions.has(suggestion.id)}
              getTypeIcon={getTypeIcon}
              getConfidenceColor={getConfidenceColor}
              getPriorityColor={getPriorityColor}
            />
          ))
        )}
      </div>

      {preview && suggestions.length > 2 && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button className="text-[#784e87] hover:text-[#6b4476] font-medium">
            View all {suggestions.length} suggestions →
          </button>
        </div>
      )}

      {/* AI Insights Footer */}
      {!preview && (
        <div className="p-6 bg-gradient-to-r from-[#784e87]/5 to-[#b8a9c0]/5 border-t border-gray-100">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-[#784e87] mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">AI Learning</h4>
              <p className="text-xs text-gray-600">
                These suggestions improve as you use Listed. Accept or reject suggestions to help me learn your preferences.
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
  isAccepted, 
  isRejected,
  getTypeIcon,
  getConfidenceColor,
  getPriorityColor
}) {
  const [showDetails, setShowDetails] = useState(false)

  if (isAccepted || isRejected) {
    return (
      <div className="p-6 bg-gray-50 opacity-75">
        <div className="flex items-center space-x-3">
          {getTypeIcon(suggestion.type)}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 line-through">
              {suggestion.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isAccepted ? 'Suggestion accepted' : 'Suggestion dismissed'}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isAccepted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {isAccepted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </div>
        </div>
      </div>
    )
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
            <h3 className="text-sm font-medium text-gray-900">
              {suggestion.title}
            </h3>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onReject(suggestion.id)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Dismiss suggestion"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAccept(suggestion.id)}
                className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
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
          <div className="flex items-center space-x-3 mb-3">
            {/* Confidence */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
              {suggestion.confidence}% confident
            </span>

            {/* Priority */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
              {suggestion.priority} priority
            </span>

            {/* Time/Impact */}
            {suggestion.estimatedTime && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {suggestion.estimatedTime}
              </span>
            )}

            {suggestion.impact && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {suggestion.impact} impact
              </span>
            )}
          </div>

          {/* Show Details Toggle */}
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
              {suggestion.suggestedDate && (
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Suggested date:</span> {suggestion.suggestedDate}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
