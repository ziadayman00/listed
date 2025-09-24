'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CheckCircle, Brain, Calendar, Zap, ArrowRight } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const Hero = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const handleGetStartedClick = () => {
    if (session) {
      router.push('/dashboard')
    } else {
      signIn('google')
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="Listed Hero Background"
          fill
          className="object-cover object-center"
          priority
          quality={90}
          unoptimized={true}
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 min-h-screen items-center py-12 lg:py-0">

          {/* Left Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-8">

            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Brain className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-sm text-white font-medium">AI-Powered Productivity</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                AI-Powered<br />
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Task Management
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Listed uses advanced AI to understand your work patterns, automatically prioritize tasks,
                and help you accomplish <span className="text-white font-semibold">3x more in half the time</span>.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
              {[
                'Smart auto-prioritization',
                'Predicts task completion',
                'Learns your work style',
                'Zero manual setup'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={handleGetStartedClick}
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold group"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-black hover:bg-white/10 px-8 py-6 text-lg font-semibold backdrop-blur-sm"
              >
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-4">Trusted by productive teams worldwide</p>
              <div className="flex items-center justify-center lg:justify-start space-x-8 opacity-60">
                <div className="text-white font-semibold">1000+ Users</div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-white font-semibold">50+ Countries</div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-white font-semibold">99% Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">

              {/* Main Dashboard Preview */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-semibold">Today's Focus</span>
                  </div>
                  <div className="text-gray-300 text-sm">4 tasks</div>
                </div>

                {/* AI Suggestion Banner */}
                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-white text-sm font-medium">AI suggests: Focus on design review first</span>
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-3">
                  {[
                    { title: 'Design review meeting', priority: 'high', time: '30 min', completed: false },
                    { title: 'Update project timeline', priority: 'medium', time: '15 min', completed: true },
                    { title: 'Client feedback review', priority: 'low', time: '45 min', completed: false }
                  ].map((task, index) => (
                    <div
                      key={index}
                      className={`bg-white/90 rounded-xl p-4 flex items-center space-x-3 transition-all duration-300 ${task.completed ? 'opacity-60' : 'hover:scale-105'
                        }`}
                    >
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                      )}

                      <div className="flex-1">
                        <div className={`font-medium text-gray-900 ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-green-100 text-green-600'
                            }`}>
                            {task.priority}
                          </span>
                          <span className="text-gray-500 text-xs">{task.time}</span>
                        </div>
                      </div>

                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Daily Progress</span>
                    <span className="text-white text-sm font-medium">67%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-400/30 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400/30 rounded-full animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 -left-6 w-4 h-4 bg-white/20 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero