'use client'

import { useState } from 'react'
import { 
  Plus, 
  Brain, 
  Clock, 
  Target,
  Calendar,
  Zap,
  CheckCircle,
  Timer
} from 'lucide-react'

export default function QuickActions() {
  const [showActions, setShowActions] = useState(false)

  const actions = [
    {
      id: 'add-task',
      title: 'Add Task',
      description: 'Create a new task',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('Add task')
    },
    {
      id: 'ai-suggest',
      title: 'AI Suggest',
      description: 'Get AI task suggestions',
      icon: Brain,
      color: 'bg-[#784e87] hover:bg-[#6b4476]',
      action: () => console.log('AI suggest')
    },
    {
      id: 'quick-timer',
      title: 'Start Timer',
      description: 'Begin a focus session',
      icon: Timer,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('Start timer')
    },
    {
      id: 'review-today',
      title: 'Review Today',
      description: 'Check today\'s progress',
      icon: CheckCircle,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('Review today')
    }
  ]

  return (
    <div className="relative">
      {/* Main Action Button */}
      <button
        onClick={() => setShowActions(!showActions)}
        className="flex items-center justify-center w-10 h-10 bg-[#784e87] text-white rounded-xl hover:bg-[#6b4476] transition-all duration-200 shadow-lg hover:shadow-xl"
        title="Quick Actions"
      >
        <Zap className={`w-5 h-5 transition-transform duration-200 ${showActions ? 'rotate-45' : ''}`} />
      </button>

      {/* Actions Menu */}
      {showActions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowActions(false)}
          ></div>
          
          {/* Actions Panel */}
          <div className="absolute top-12 right-0 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-fade-in">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-xs text-gray-600">Boost your productivity</p>
            </div>
            
            <div className="space-y-2">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action()
                      setShowActions(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center text-white transition-colors`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{action.title}</div>
                      <div className="text-xs text-gray-600">{action.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#784e87]">8</div>
                  <div className="text-xs text-gray-600">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">32</div>
                  <div className="text-xs text-gray-600">This Week</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
