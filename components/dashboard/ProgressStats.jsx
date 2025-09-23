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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats({
        totalTasks: data.overview.totalTasks,
        completedTasks: data.overview.completedTasks,
        completionRate: data.overview.completionRate,
        averageTaskTime: '2.3h', // TODO: Calculate from real data
        streak: 12, // TODO: Calculate from real data
        thisWeekCompleted: data.overview.thisWeekTasks,
        lastWeekCompleted: 6, // TODO: Calculate from real data
        productivity: data.overview.completionRate
      })
    } catch (error) {
      console.error('Error fetching progress stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const weeklyData = [
    { day: 'Mon', completed: 3, created: 4 },
    { day: 'Tue', completed: 5, created: 3 },
    { day: 'Wed', completed: 2, created: 5 },
    { day: 'Thu', completed: 4, created: 2 },
    { day: 'Fri', completed: 6, created: 4 },
    { day: 'Sat', completed: 1, created: 2 },
    { day: 'Sun', completed: 2, created: 1 }
  ]

  const categoryData = [
    { name: 'Work', completed: 18, total: 25, color: '#784e87' },
    { name: 'Personal', completed: 8, total: 12, color: '#b8a9c0' },
    { name: 'Learning', completed: 4, total: 6, color: '#10b981' },
    { name: 'Health', completed: 2, total: 4, color: '#f59e0b' }
  ]

  const achievements = [
    {
      id: 1,
      title: 'Task Master',
      description: 'Completed 30+ tasks',
      icon: Award,
      earned: true,
      earnedDate: '2024-01-15'
    },
    {
      id: 2,
      title: 'Streak Champion',
      description: '10 day completion streak',
      icon: Zap,
      earned: true,
      earnedDate: '2024-01-12'
    },
    {
      id: 3,
      title: 'Early Bird',
      description: 'Complete 5 tasks before 9 AM',
      icon: Clock,
      earned: false,
      progress: 3
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {preview ? 'Progress Overview' : 'Your Progress & Analytics'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {preview ? 'Your productivity at a glance' : 'Track your productivity and task completion patterns'}
            </p>
          </div>
          {!preview && (
            <div className="flex space-x-2">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#784e87] focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
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

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Weekly Goal Progress</span>
            <span className="text-sm text-gray-600">{stats.thisWeekCompleted}/10 tasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#784e87] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.thisWeekCompleted / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            title="This Week"
            value={`+${stats.thisWeekCompleted - stats.lastWeekCompleted} tasks`}
            description="vs last week"
            trend="up"
          />
          <InsightCard
            title="Productivity Score"
            value={`${stats.productivity}/100`}
            description="Based on completion rate & consistency"
            trend="up"
          />
          <InsightCard
            title="Best Day"
            value="Friday"
            description="Most productive day this week"
            trend="neutral"
          />
        </div>
      </div>

      {!preview && (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      chartType === 'bar' 
                        ? 'bg-[#784e87] text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      chartType === 'line' 
                        ? 'bg-[#784e87] text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <WeeklyChart data={weeklyData} type={chartType} />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks by Category</h3>
              <div className="space-y-4">
                {categoryData.map((category) => (
                  <CategoryProgress key={category.name} category={category} />
                ))}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, subtitle, icon: Icon, color, bgColor }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
    </div>
  )
}

// Insight Card Component
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
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className={`w-6 h-6 ${trendColors[trend]} rounded-full flex items-center justify-center text-xs`}>
          {trendIcons[trend]}
        </div>
      </div>
      <div className="text-lg font-semibold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  )
}

// Weekly Chart Component (Simplified Bar Chart)
function WeeklyChart({ data, type }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.completed, d.created)))

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((day) => (
          <div key={day.day} className="flex-1 flex flex-col items-center">
            <div className="flex-1 flex items-end space-x-1 mb-2">
              {/* Completed tasks bar */}
              <div
                className="bg-[#784e87] rounded-t w-3 transition-all duration-300"
                style={{ height: `${(day.completed / maxValue) * 100}%` }}
                title={`${day.completed} completed`}
              ></div>
              {/* Created tasks bar */}
              <div
                className="bg-[#b8a9c0] rounded-t w-3 transition-all duration-300"
                style={{ height: `${(day.created / maxValue) * 100}%` }}
                title={`${day.created} created`}
              ></div>
            </div>
            <span className="text-xs text-gray-600 font-medium">{day.day}</span>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#784e87] rounded"></div>
          <span className="text-xs text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#b8a9c0] rounded"></div>
          <span className="text-xs text-gray-600">Created</span>
        </div>
      </div>
    </div>
  )
}

// Category Progress Component
function CategoryProgress({ category }) {
  const percentage = Math.round((category.completed / category.total) * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          ></div>
          <span className="text-sm font-medium text-gray-700">{category.name}</span>
        </div>
        <span className="text-sm text-gray-600">
          {category.completed}/{category.total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: category.color 
          }}
        ></div>
      </div>
    </div>
  )
}

// Achievement Card Component
function AchievementCard({ achievement }) {
  const Icon = achievement.icon

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      achievement.earned 
        ? 'border-[#784e87] bg-[#784e87]/5' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          achievement.earned 
            ? 'bg-[#784e87] text-white' 
            : 'bg-gray-200 text-gray-400'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{achievement.title}</h4>
          <p className="text-xs text-gray-600">{achievement.description}</p>
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
            <span>{achievement.progress}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-[#784e87] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(achievement.progress / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">Not yet earned</div>
      )}
    </div>
  )
}
