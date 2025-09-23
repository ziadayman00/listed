import React from 'react'
import { Button } from '@/components/ui/button'
import { Check, Star, Zap } from 'lucide-react'

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with AI-powered task management",
      features: [
        "Up to 50 tasks",
        "Basic AI suggestions",
        "Mobile & web access",
        "Email support",
        "Task prioritization"
      ],
      cta: "Get Started Free",
      popular: false,
      icon: Check
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "Ideal for professionals who want advanced AI features",
      features: [
        "Unlimited tasks",
        "Advanced AI insights",
        "Smart scheduling",
        "Priority support",
        "Team collaboration",
        "Custom workflows",
        "Analytics dashboard",
        "Calendar integration"
      ],
      cta: "Start Pro Trial",
      popular: true,
      icon: Star
    },
    {
      name: "Enterprise",
      price: "$29",
      period: "per month",
      description: "For teams and organizations requiring enterprise features",
      features: [
        "Everything in Pro",
        "Advanced team management",
        "Custom AI training",
        "API access",
        "SSO integration",
        "Dedicated support",
        "Custom integrations",
        "Advanced security"
      ],
      cta: "Contact Sales",
      popular: false,
      icon: Zap
    }
  ]

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Choose Your{' '}
            <span className="text-[#784e87]">Perfect Plan</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Start free and scale as you grow. Every plan includes our core AI features 
            to help you stay organized and productive.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 pt-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.popular 
                  ? 'ring-2 ring-[#784e87] lg:scale-105' 
                  : 'hover:shadow-xl'
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-[#784e87] text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-1 shadow-lg">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                    plan.popular 
                      ? 'bg-[#784e87] text-white' 
                      : 'bg-[#784e87]/10 text-[#784e87]'
                  }`}>
                    <plan.icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {plan.period}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.popular 
                            ? 'bg-[#784e87] text-white' 
                            : 'bg-[#784e87]/10 text-[#784e87]'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-[#784e87] hover:bg-[#6b4476] text-white shadow-lg hover:shadow-xl'
                      : 'bg-white border-2 border-[#784e87] text-[#784e87] hover:bg-[#784e87] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-[#b8a9c0]/30 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-[#784e87]/20 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-[#784e87]/10 rounded-xl flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-[#784e87]" />
                </div>
                <h4 className="font-semibold text-gray-900">30-Day Free Trial</h4>
                <p className="text-sm text-gray-600">Try Pro features risk-free</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-[#784e87]/10 rounded-xl flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-[#784e87]" />
                </div>
                <h4 className="font-semibold text-gray-900">No Setup Fees</h4>
                <p className="text-sm text-gray-600">Start using Listed immediately</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-[#784e87]/10 rounded-xl flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-[#784e87]" />
                </div>
                <h4 className="font-semibold text-gray-900">Cancel Anytime</h4>
                <p className="text-sm text-gray-600">No long-term commitments</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Pricing
