import React from 'react'
import { Brain, TrendingUp, Smartphone, Sparkles } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Task Suggestions",
      description: "Let our AI analyze your patterns and suggest the most important tasks to focus on next."
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description: "Visualize your productivity with intelligent insights and progress tracking over time."
    },
    {
      icon: Smartphone,
      title: "Sync Across Devices",
      description: "Access your tasks anywhere, anytime. Perfect synchronization across all your devices."
    },
    {
      icon: Sparkles,
      title: "Simple & Intuitive UI",
      description: "Clean, modern interface designed for focus. No clutter, just pure productivity."
    }
  ]

  return (
    <section id="features" className="features bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Why Choose{' '}
            <span className="text-[#784e87]">Listed</span>?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the perfect blend of artificial intelligence and intuitive design. 
            Listed transforms how you manage tasks and achieve your goals.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Icon Container */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-[#784e87]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#784e87]/20 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-[#784e87]" />
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#784e87] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-[#b8a9c0]/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Optional: App Mockup Section */}
        <div className="mt-20">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Mockup Placeholder */}
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  {/* Mock App Interface */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-[#784e87] rounded w-24"></div>
                      <div className="w-6 h-6 bg-[#784e87]/20 rounded-full"></div>
                    </div>
                    
                    {/* Mock Task Items */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-4 h-4 border-2 border-[#784e87] rounded"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-300 rounded w-3/4 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <Brain className="w-4 h-4 text-[#784e87]" />
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-4 h-4 bg-[#784e87] rounded flex items-center justify-center">
                          <div className="w-2 h-1 bg-white rounded"></div>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-300 rounded w-2/3 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                        </div>
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-[#784e87]/5 rounded-lg border-2 border-[#784e87]/20">
                        <div className="w-4 h-4 border-2 border-[#784e87] rounded"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-[#784e87]/30 rounded w-4/5 mb-1"></div>
                          <div className="h-2 bg-[#784e87]/20 rounded w-2/5"></div>
                        </div>
                        <div className="text-xs bg-[#784e87] text-white px-2 py-1 rounded-full">AI</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#b8a9c0]/30 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[#784e87]/20 rounded-full animate-pulse delay-300"></div>
              </div>

              {/* Right: Content */}
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  See Listed in{' '}
                  <span className="text-[#784e87]">Action</span>
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Watch as our AI intelligently prioritizes your tasks, suggests optimal scheduling, 
                  and helps you maintain focus on what matters most. Every interaction is designed 
                  to make you more productive.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#784e87] rounded-full"></div>
                    <span className="text-gray-700">Real-time AI task analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#784e87] rounded-full"></div>
                    <span className="text-gray-700">Smart priority suggestions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#784e87] rounded-full"></div>
                    <span className="text-gray-700">Seamless workflow optimization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
