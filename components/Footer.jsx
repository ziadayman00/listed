'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Instagram, Linkedin, Github, Heart } from 'lucide-react'

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(2025) // Default to current year

  useEffect(() => {
    // Set the current year on the client side to avoid hydration mismatch
    setCurrentYear(new Date().getFullYear())
  }, [])

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'About', href: '#about' },
      { name: 'Contact', href: '#contact' }
    ],
    support: [
      { name: 'Help Center', href: '#help' },
      { name: 'Documentation', href: '#docs' },
      { name: 'API Reference', href: '#api' },
      { name: 'Status', href: '#status' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Blog', href: '#blog' },
      { name: 'Careers', href: '#careers' },
      { name: 'Press Kit', href: '#press' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Cookie Policy', href: '#cookies' },
      { name: 'GDPR Compliance', href: '#gdpr' }
    ]
  }

  const socialLinks = [
    { 
      name: 'Instagram', 
      icon: Instagram, 
      href: 'https://www.instagram.com/zeyad_ayman6/',
      color: 'hover:text-pink-400'
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      href: 'https://www.linkedin.com/in/ziad-ayman-6249122a4/',
      color: 'hover:text-blue-400'
    },
    { 
      name: 'GitHub', 
      icon: Github, 
      href: 'https://github.com/ziadayman00',
      color: 'hover:text-gray-300'
    }
  ]

  return (
    <footer className="bg-gray-900">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2 lg:col-span-2">
              <div className="mb-6">
                <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
                  <Image
                    src="/whitelogo.png"
                    alt="Listed"
                    width={150}
                    height={150}
                    className="h-14 w-auto"
                  />
                </Link>
              </div>
              
              <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
                The AI-powered task manager that learns your patterns, predicts your needs, 
                and helps you achieve more with less effort.
              </p>
              
              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-400 text-sm">
                  <Mail className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <a href="mailto:hello@listed.app" className="hover:text-white transition-colors">
                    hello@listed.app
                  </a>
                </div>
                <div className="flex items-center space-x-3 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span>Cairo, Egypt</span>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-medium mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-medium mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-white/20">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center space-y-6 space-y-reverse md:space-y-0">
            {/* Copyright */}
            <div className="text-white/80 text-center md:text-left">
              <p className="text-sm font-medium">
                © {currentYear} Listed. 
                by{' '}
                <span className="font-semibold text-white">Ziad Ayman</span>
                {' '}.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-white/70 ${social.color} transition-all duration-300 transform hover:scale-110 p-2 rounded-full hover:bg-white/10`}
                  aria-label={`Follow Ziad Ayman on ${social.name}`}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Additional Professional Touch */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/60 text-xs font-medium">
              Built with cutting-edge technology. Powered by artificial intelligence.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer