import React from 'react'
import { Target, Users, Lightbulb, Zap } from 'lucide-react'

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To revolutionize productivity by making AI-powered task management accessible to everyone, everywhere."
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "We constantly push boundaries to deliver cutting-edge AI features that adapt to your unique workflow."
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Every feature is designed with our users in mind, ensuring simplicity without sacrificing power."
    },
    {
      icon: Zap,
      title: "Efficiency",
      description: "We believe productivity tools should save time, not waste it. Listed gets out of your way and gets things done."
    }
  ]

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Main About Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                About{' '}
                <span className="text-[#784e87]">Listed</span>
              </h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  Listed was born from a simple observation: people spend more time organizing their tasks 
                  than actually completing them. We set out to change that with artificial intelligence 
                  that truly understands how you work.
                </p>
                <p>
                  Our AI doesn't just store your tasks—it learns your patterns, predicts your needs, 
                  and helps you focus on what matters most. Whether you're a busy professional, 
                  a student juggling multiple projects, or a team leader coordinating complex workflows, 
                  Listed adapts to your unique style.
                </p>
                <p>
                  We believe productivity should feel effortless. That's why Listed combines powerful 
                  AI capabilities with an intuitive interface that gets out of your way, letting you 
                  achieve more with less stress.
                </p>
              </div>
            </div>

            {/* Founder Info */}
            <div className="bg-[#784e87]/5 rounded-2xl p-6 border border-[#784e87]/10">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Meet the Founder
              </h4>
              <p className="text-gray-600 mb-3">
                <span className="font-medium text-[#784e87]">Ziad Ayman</span>, based in Egypt, 
                founded Listed with a vision to revolutionize how people manage their daily tasks 
                through intelligent AI assistance.
              </p>
              
            </div>

            
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#784e87]/5 to-[#b8a9c0]/10 rounded-3xl p-8 lg:p-12">
              {/* Abstract Illustration */}
              <div className="relative">
                {/* Main Circle */}
                <div className="w-48 h-48 mx-auto bg-[#784e87]/10 rounded-full flex items-center justify-center relative">
                  <div className="w-32 h-32 bg-[#784e87]/20 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#784e87] rounded-full flex items-center justify-center">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#b8a9c0]/30 rounded-full flex items-center justify-center animate-pulse">
                    <Lightbulb className="w-6 h-6 text-[#784e87]" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Users className="w-8 h-8 text-[#784e87]" />
                  </div>
                  <div className="absolute top-1/2 -right-8 w-10 h-10 bg-[#784e87] rounded-full flex items-center justify-center animate-bounce delay-300">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Connecting Lines */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-24 h-0.5 bg-[#b8a9c0]/30 rotate-45"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-20 h-0.5 bg-[#b8a9c0]/30 -rotate-45"></div>
                </div>
              </div>

              {/* Background Decorations */}
              <div className="absolute top-4 left-4 w-3 h-3 bg-[#784e87]/20 rounded-full"></div>
              <div className="absolute bottom-6 right-6 w-2 h-2 bg-[#b8a9c0]/40 rounded-full"></div>
              <div className="absolute top-1/3 right-4 w-1.5 h-1.5 bg-[#784e87]/30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              What Drives Us
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our core values shape everything we do, from product development to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="text-center group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="w-16 h-16 bg-[#784e87]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#784e87]/20 transition-colors duration-300">
                  <value.icon className="w-8 h-8 text-[#784e87]" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
