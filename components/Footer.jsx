'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Twitter, Linkedin, Github, Heart } from 'lucide-react'

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(2024) // Default fallback year

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
      { name: 'Help Center', href: '#' },
      { name: 'Contact Support', href: '#' },
      { name: 'Status Page', href: '#' },
      { name: 'Bug Reports', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' }
  ]

  return (
    <footer className="bg-[#784e87]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-8">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center mb-6">
                <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
                  <Image
                    src="/whitelogo.png"
                    alt="Listed"
                    width={150}
                    height={150}
                    className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto"
                  />
                </Link>
              </div>
              <p className="text-white/80 mb-6 max-w-md text-sm sm:text-base leading-relaxed">
                The AI-powered task manager that learns your patterns, predicts your needs, 
                and helps you achieve more with less effort. Built in Egypt with ❤️.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-white/80 text-sm sm:text-base">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                  <span className="break-all">hello@listed.app</span>
                </div>
                <div className="flex items-center space-x-3 text-white/80 text-sm sm:text-base">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                  <span>Egypt</span>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Product</h3>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Support</h3>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Legal</h3>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-white/70 hover:text-white transition-colors duration-200 text-sm sm:text-base"
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
        <div className="py-6 sm:py-8 border-t border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className="text-white/80 text-center sm:text-left">
              <p className="text-sm sm:text-base">
                © {currentYear} Listed. Made with{' '}
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 inline text-red-400" /> by{' '}
                <span className="font-medium text-white">Ziad Ayman</span> in Egypt.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-white/60 hover:text-white transition-colors duration-200 p-1"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
