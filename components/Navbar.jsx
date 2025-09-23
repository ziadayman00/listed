'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { useSession } from 'next-auth/react'
import AuthButton from '@/components/AuthButton'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' }
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile header with hamburger and buttons */}
        <div className="flex justify-between items-center h-16 md:hidden">
          {/* Left side - Enhanced Hamburger menu (mobile only) */}
          <div className="flex items-center">
            <button
              onClick={toggleMenu}
              className="relative w-10 h-10 flex items-center justify-center group"
              aria-label="Toggle menu"
            >
              <div className="flex flex-col items-center justify-center w-6 h-6">
                <span
                  className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ease-in-out my-1 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ease-in-out ${
                    isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                ></span>
              </div>
            </button>
          </div>

          {/* Center - Logo (mobile) */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Listed"
                width={75}
                height={75}
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Right side - Auth (mobile) */}
          <div className="flex items-center">
            <AuthButton isMobile={false} />
          </div>
        </div>

        {/* Desktop layout - Logo centered above links */}
        <div className="hidden md:block">
          {/* Logo centered */}
          <div className="flex justify-center py-6">
            <Link href="/" className="flex justify-center">
              <Image
                src="/logo.png"
                alt="Listed"
                width={150}
                height={150}
                className="md:w-32 lg:w-40"
              />
            </Link>
          </div>

            {/* Navigation links and buttons in one line */}
          <div className="flex justify-center items-center pb-4 gap-8">
            {/* Navigation links */}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-[#784e87] transition-colors duration-200 text-sm font-medium relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#784e87] transition-all duration-200 group-hover:w-full"></span>
              </Link>
            ))}
            
            {/* Dashboard Button (when logged in) */}
            {session && (
              <>
                {/* Separator */}
                <div className="w-px h-6 bg-gray-300"></div>
                
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#784e87] text-white rounded-lg hover:bg-[#6b4476] transition-colors duration-200 text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </>
            )}
            
            {/* Separator */}
            <div className="w-px h-6 bg-gray-300"></div>
            
            {/* Auth */}
            <AuthButton isMobile={false} />
          </div>
        </div>

        {/* Enhanced Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 bg-white border-t border-gray-100 shadow-lg">
              {/* Navigation Links */}
              <div className="space-y-2 mb-6">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-[#784e87] hover:bg-gray-50 transition-all duration-200 text-base font-medium rounded-xl border border-transparent hover:border-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInFromLeft 0.3s ease-out forwards'
                    }}
                  >
                    <span className="w-2 h-2 bg-[#784e87] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </Link>
                ))}
                
                {/* Dashboard Link (when logged in) */}
                {session && (
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-3 text-white bg-[#784e87] hover:bg-[#6b4476] transition-all duration-200 text-base font-medium rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      animationDelay: `${navLinks.length * 50}ms`,
                      animation: 'slideInFromLeft 0.3s ease-out forwards'
                    }}
                  >
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Dashboard
                  </Link>
                )}
              </div>
              
              {/* Auth Section */}
              <AuthButton isMobile={true} />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
