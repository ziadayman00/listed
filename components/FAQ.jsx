'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SupportModal from '@/components/SupportModal'

const FAQ = () => {
  const [openItems, setOpenItems] = useState({})
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const faqs = [
    {
      question: "How does the AI task prioritization work?",
      answer: "Our AI analyzes your task patterns, deadlines, and work habits to intelligently prioritize your tasks. It learns from your behavior and suggests the most important tasks to focus on based on urgency, importance, and your personal productivity patterns."
    },
    {
      question: "Can I try Listed for free?",
      answer: "Yes! Listed offers a generous free plan that includes up to 50 tasks, basic AI suggestions, and access to our mobile and web apps. You can also try our Pro plan free for 30 days with no credit card required."
    },
    {
      question: "How does Listed sync across devices?",
      answer: "Listed automatically syncs your tasks, preferences, and AI insights across all your devices in real-time. Whether you're using our web app, mobile app, or desktop version, your data is always up-to-date and accessible."
    },
    {
      question: "Is my data secure with Listed?",
      answer: "Absolutely. We use enterprise-grade encryption to protect your data both in transit and at rest. Your tasks and personal information are stored securely and never shared with third parties. We're SOC 2 compliant and follow industry best practices for data security."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time with no penalties or cancellation fees. Your account will remain active until the end of your current billing period, and you can always downgrade to our free plan."
    },
    {
      question: "What's included in the Enterprise plan?",
      answer: "The Enterprise plan includes everything in Pro plus advanced team management, custom AI training for your organization, API access, SSO integration, dedicated support, custom integrations, and enhanced security features. Perfect for larger teams and organizations."
    },
    {
      question: "How accurate are the AI suggestions?",
      answer: "Our AI becomes more accurate over time as it learns your patterns. Most users see significant improvements in productivity within the first week. The AI considers factors like your work schedule, task complexity, deadlines, and historical completion patterns to provide highly relevant suggestions."
    },
    {
      question: "Do you offer team collaboration features?",
      answer: "Yes! Our Pro and Enterprise plans include team collaboration features like shared projects, task assignment, progress tracking, team analytics, and real-time collaboration tools. Teams can work together seamlessly while benefiting from AI-powered insights."
    }
  ]

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked{' '}
            <span className="text-[#784e87]">Questions</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Listed and how our AI-powered task management works.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl transition-all duration-300 hover:shadow-lg"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#784e87] focus:ring-opacity-50 rounded-2xl"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </h3>
                <div className={`flex-shrink-0 transition-transform duration-300 ${
                  openItems[index] ? 'transform rotate-180' : ''
                }`}>
                  {openItems[index] ? (
                    <ChevronUp className="w-6 h-6 text-[#784e87]" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-[#784e87]" />
                  )}
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openItems[index] 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you get the most out of Listed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsSupportModalOpen(true)}
                className="px-6 py-3 bg-[#784e87] text-white rounded-xl font-semibold hover:bg-[#6b4476] transition-colors duration-300"
              >
                Contact Support
              </button>
              <button className="px-6 py-3 border-2 border-[#784e87] text-[#784e87] rounded-xl font-semibold hover:bg-[#784e87] hover:text-white transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>

        {/* Support Modal */}
        <SupportModal 
          isOpen={isSupportModalOpen} 
          onClose={() => setIsSupportModalOpen(false)} 
        />
      </div>
    </section>
  )
}

export default FAQ
