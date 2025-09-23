'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CheckCircle, Brain, Calendar, Zap } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const Hero = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const handleGetStartedClick = () => {
    if (session) {
      router.push('/dashboard')
    } else {
      signIn('google') // Redirect to Google login
    }
  }

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Hero Image Container */}
        <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] rounded-xl overflow-hidden shadow-lg">
          <Image
            src="/hero.jpg"
            alt="Listed Hero"
            fill
            className="object-cover"
            priority
          />
          
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-xs rounded-xl"></div>
          
          {/* Floating decorative elements */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-[#b8a9c0]/20 rounded-full blur-lg animate-pulse"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-white/3 rounded-full blur-2xl"></div>
            <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-[#b8a9c0]/15 rounded-full blur-md animate-pulse delay-300"></div>
          </div>
    
          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex items-center p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-6 lg:space-y-8 animate-fade-in">
               

                {/* Headline */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                  The Most{' '}
                  <span className="text-[#b8a9c0]">Intelligent</span>{' '}
                  Task Manager
                </h1>

                {/* Subheading */}
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#F3F3F3] leading-relaxed max-w-xl lg:max-w-2xl mx-auto lg:mx-0">
                  Experience the future of productivity with Listed's AI that learns your patterns, 
                  predicts your needs, and automatically organizes your workflow. 
                  <span className="text-white font-semibold"> 10x your productivity</span> with zero effort.
                </p>

                {/* Power Features */}
                <div className="hidden sm:flex sm:flex-col sm:items-center lg:grid lg:grid-cols-2 lg:items-start sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:gap-8 gap-3 lg:contents">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#b8a9c0] rounded-full flex-shrink-0"></div>
                      <span className="text-[#F3F3F3]">Auto-prioritizes tasks by urgency</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#b8a9c0] rounded-full flex-shrink-0"></div>
                      <span className="text-[#F3F3F3]">Predicts completion times</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-8 gap-3 lg:contents">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#b8a9c0] rounded-full flex-shrink-0"></div>
                      <span className="text-[#F3F3F3]">Smart deadline management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#b8a9c0] rounded-full flex-shrink-0"></div>
                      <span className="text-[#F3F3F3]">Learns from your habits</span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Button 
                    size="default"
                    onClick={handleGetStartedClick}
                    className="bg-white text-[#784e87] hover:bg-gray-100 hover:shadow-lg transition-all duration-300 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold w-full sm:w-auto"
                  >
                    Get Started
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="border-2 border-white text-white hover:bg-white hover:text-[#784e87] transition-all duration-300 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold bg-transparent w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Right Illustration - Hidden on small mobile, shown on lg+ */}
              <div className="hidden lg:flex justify-center lg:justify-end mt-6 lg:mt-0">
                <div className="relative w-full max-w-xs md:max-w-sm lg:max-w-md">
                  {/* Main illustration container */}
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 lg:p-8 border border-white/20">
                    {/* AI Brain Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="bg-white/20 rounded-full p-4">
                        <Brain className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                      </div>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-3 lg:space-y-4">
                      {/* Task Card 1 */}
                      <div className="bg-white/90 rounded-xl p-3 lg:p-4 flex items-center space-x-3 transform hover:scale-105 transition-transform duration-300">
                        <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-[#784e87]" />
                        <div className="flex-1">
                          <div className="h-2.5 lg:h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                        </div>
                        <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500" />
                      </div>

                      {/* Task Card 2 */}
                      <div className="bg-white/90 rounded-xl p-3 lg:p-4 flex items-center space-x-3 transform hover:scale-105 transition-transform duration-300 delay-100">
                        <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-2.5 lg:h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-2 bg-gray-100 rounded w-1/3"></div>
                        </div>
                        <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
                      </div>

                      {/* Task Card 3 */}
                      <div className="bg-white/90 rounded-xl p-3 lg:p-4 flex items-center space-x-3 transform hover:scale-105 transition-transform duration-300 delay-200">
                        <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-gray-300 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-2.5 lg:h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                          <div className="h-2 bg-gray-100 rounded w-2/5"></div>
                        </div>
                        <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-[#784e87] rounded-full"></div>
                      </div>
                    </div>

                    {/* Floating elements */}
                    <div className="absolute -top-4 -right-4 w-6 h-6 lg:w-8 lg:h-8 bg-[#b8a9c0] rounded-full opacity-60 animate-pulse"></div>
                    <div className="absolute -bottom-2 -left-2 w-5 h-5 lg:w-6 lg:h-6 bg-white/40 rounded-full animate-pulse delay-300"></div>
                  </div>

                  {/* Additional floating elements */}
                  <div className="absolute top-0 left-0 w-3 h-3 lg:w-4 lg:h-4 bg-white/30 rounded-full animate-bounce delay-500"></div>
                  <div className="absolute bottom-10 right-0 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-[#b8a9c0]/50 rounded-full animate-bounce delay-700"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
