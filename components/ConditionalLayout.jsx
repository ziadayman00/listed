'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const ConditionalLayout = ({ children }) => {
  const pathname = usePathname()
  
  // Check if we're on an admin route
  const isAdminRoute = pathname?.startsWith('/admin')
  
  // If it's an admin route, just render children without navbar/footer
  if (isAdminRoute) {
    return <>{children}</>
  }
  
  // For all other routes, render with navbar and footer
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

export default ConditionalLayout
