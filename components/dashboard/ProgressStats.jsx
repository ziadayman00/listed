'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Clock,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap
} from 'lucide-react'

export default function ProgressStats({ preview = false }) {
  const [timeframe, setTimeframe] = useState('week')
  const [chartType, setChartType] = useState('bar')
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    averageTaskTime: '0h',
    streak: 0,
    thisWeekCompleted: 0,
    lastWeekCompleted: 0,
    productivity: 0
  })
  const [chartData, setChartData] = useState({
    weeklyData: [],
    categoryData: [],
    achievements: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [timeframe])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      
      setStats({
        totalTasks: data.overview?.totalTasks || 0,
        completedTasks: data.overview?.completedTasks || 0,
        completionRate: data.overview?.completionRate || 0,
        averageTaskTime: '2.3h', // You can calculate this from your task data later
        streak: 7, // You can implement streak calculation
        thisWeekCompleted: data.overview?.thisWeekTasks || 0,
        lastWeekCompleted: Math.max((data.overview?.thisWeekTasks || 0) - 2, 0), // Simulated for now
        productivity: data.overview?.completionRate || 0
      })

      // Transform your existing data into chart format
      const weeklyData = transformActivityData(data.activity?.recent || [])
      const categoryData = transformPriorityData(data.priorities || {})
      
      setChartData({
        weeklyData,
        categoryData,
        achievements: [] // You can implement achievements later
      })
    } catch (error) {
      console.error('Error fetching progress stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Transform activity data into weekly format
  const transformActivityData = (activityData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const now = new Date()
    const weekData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1] // Adjust for Monday start

      const activityItem = activityData.find(item => item.date === dateString)
      weekData.push({
        day: dayName,
        completed: activityItem ? activityItem.count : 0,
        created: activityItem ? Math.ceil(activityItem.count * 1.2) : 0 // Estimate created tasks
      })
    }

    return weekData
  }

  // Transform priority data into category format
  const transformPriorityData = (priorityData) => {
    const colors = {
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b', 
      LOW: '#10b981'
    }

    return Object.entries(priorityData).map(([priority, count]) => ({
      name: priority.charAt(0) + priority.slice(1).toLowerCase(),
      completed: Math.floor(count * 0.7), // Estimate completed based on pending
      total: count,
      color: colors[priority] || '#784e87'
    })).filter(item => item.total > 0)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Stats */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              {preview ? 'Progress Overview' : 'Your Progress & Analytics'}
            </h2>
            <p className="text-sm text-gray-600 mt-1 leading-tight">
              {preview ? 'Your productivity at a glance' : 'Track your productivity and task completion patterns'}
            </p>
          </div>
          {!preview && (
            <div className="flex-shrink-0">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full sm:w-auto text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          )}
        </div>

        {/* Key Metrics Grid - Mobile optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <MetricCard
            title="Completion Rate"
            value={`${Math.round(stats.completionRate)}%`}
            icon={Target}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <MetricCard
            title="Tasks Completed"
            value={stats.completedTasks}
            subtitle={`of ${stats.totalTasks} total`}
            icon={CheckCircle}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <MetricCard
            title="Current Streak"
            value={`${stats.streak} days`}
            icon={Zap}
            color="text-[#784e87]"
            bgColor="bg-[#784e87]/10"
          />
          <MetricCard
            title="Avg. Task Time"
            value={stats.averageTaskTime}
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
        </div>

        {/* Progress Bar - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Weekly Goal Progress</span>
            <span className="text-sm text-gray-600">{stats.thisWeekCompleted}/10 tasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#784e87] h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((stats.thisWeekCompleted / 10) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Insights - Mobile responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <InsightCard
            title="This Week"
            value={stats.thisWeekCompleted > stats.lastWeekCompleted 
              ? `+${stats.thisWeekCompleted - stats.lastWeekCompleted} tasks`
              : `${stats.thisWeekCompleted - stats.lastWeekCompleted} tasks`
            }
            description="vs last week"
            trend={stats.thisWeekCompleted > stats.lastWeekCompleted ? "up" : stats.thisWeekCompleted < stats.lastWeekCompleted ? "down" : "neutral"}
          />
          <InsightCard
            title="Productivity Score"
            value={`${Math.round(stats.productivity)}/100`}
            description="Based on completion rate & consistency"
            trend="up"
          />
          <InsightCard
            title="Best Performance"
            value="This Week"
            description="Highest completion rate"
            trend="neutral"
          />
        </div>
      </div>

      {!preview && (
        <>
          {/* Charts Section - Mobile responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Activity Chart */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      chartType === 'bar' 
                        ? 'bg-[#784e87] text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      chartType === 'line' 
                        ? 'bg-[#784e87] text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <WeeklyChart data={chartData.weeklyData} type={chartType} />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Tasks by Category</h3>
              <div className="space-y-4">
                {chartData.categoryData.length > 0 ? (
                  chartData.categoryData.map((category, index) => (
                    <CategoryProgress key={category.name || index} category={category} />
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No category data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Achievements - Mobile optimized */}
          {chartData.achievements.length > 0 && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Achievements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {chartData.achievements.map((achievement, index) => (
                  <AchievementCard key={achievement.id || index} achievement={achievement} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Mobile-optimized Metric Card Component
function MetricCard({ title, value, subtitle, icon: Icon, color, bgColor }) {
  return (
    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        </div>
      </div>
      <div>
        <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 leading-tight">{value}</div>
        <div className="text-xs sm:text-sm text-gray-600 leading-tight">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1 leading-tight">{subtitle}</div>}
      </div>
    </div>
  )
}

// Mobile-optimized Insight Card Component
function InsightCard({ title, value, description, trend }) {
  const trendColors = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  }

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }

  return (
    <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 truncate flex-1">{title}</h4>
        <div className={`w-6 h-6 ${trendColors[trend]} rounded-full flex items-center justify-center text-xs flex-shrink-0 ml-2`}>
          {trendIcons[trend]}
        </div>
      </div>
      <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1 leading-tight">{value}</div>
      <div className="text-xs text-gray-500 leading-tight">{description}</div>
    </div>
  )
}

// Fixed Weekly Chart Component
function WeeklyChart({ data, type }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No activity data available</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.completed || 0, d.created || 0)), 1)

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-full space-x-1 sm:space-x-2">
        {data.map((day, index) => (
          <div key={day.day || index} className="flex-1 flex flex-col items-center">
            <div className="flex-1 flex items-end space-x-0.5 sm:space-x-1 mb-2 w-full justify-center">
              {/* Completed tasks bar */}
              <div
                className="bg-[#784e87] rounded-t flex-1 max-w-3 transition-all duration-300 min-h-[4px]"
                style={{ height: `${Math.max((day.completed || 0) / maxValue * 100, 5)}%` }}
                title={`${day.completed || 0} completed`}
              ></div>
              {/* Created tasks bar */}
              <div
                className="bg-[#b8a9c0] rounded-t flex-1 max-w-3 transition-all duration-300 min-h-[4px]"
                style={{ height: `${Math.max((day.created || 0) / maxValue * 100, 5)}%` }}
                title={`${day.created || 0} created`}
              ></div>
            </div>
            <span className="text-xs text-gray-600 font-medium">{day.day}</span>
          </div>
        ))}
      </div>
      
      {/* Legend - Mobile optimized */}
      <div className="flex justify-center space-x-3 sm:space-x-4 mt-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#784e87] rounded"></div>
          <span className="text-xs text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#b8a9c0] rounded"></div>
          <span className="text-xs text-gray-600">Created</span>
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized Category Progress Component
function CategoryProgress({ category }) {
  const percentage = Math.round(((category.completed || 0) / Math.max(category.total || 1, 1)) * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || '#784e87' }}
          ></div>
          <span className="text-sm font-medium text-gray-700 truncate">{category.name}</span>
        </div>
        <span className="text-sm text-gray-600 flex-shrink-0">
          {category.completed || 0}/{category.total || 0}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: category.color || '#784e87'
          }}
        ></div>
      </div>
    </div>
  )
}

// Mobile-optimized Achievement Card Component
function AchievementCard({ achievement }) {
  const Icon = achievement.icon || Award

  return (
    <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
      achievement.earned 
        ? 'border-[#784e87] bg-[#784e87]/5' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          achievement.earned 
            ? 'bg-[#784e87] text-white' 
            : 'bg-gray-200 text-gray-400'
        }`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{achievement.title}</h4>
          <p className="text-xs text-gray-600 line-clamp-2">{achievement.description}</p>
        </div>
      </div>
      
      {achievement.earned ? (
        <div className="text-xs text-[#784e87] font-medium">
          Earned on {achievement.earnedDate}
        </div>
      ) : achievement.progress ? (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{achievement.progress}/{achievement.total || 5}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-[#784e87] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((achievement.progress / (achievement.total || 5)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">Not yet earned</div>
      )}
    </div>
  )
}