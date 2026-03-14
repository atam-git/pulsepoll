'use client'

import { ReactNode, useState } from 'react'
import { Sidebar } from '@/components/navigation/Sidebar'
import { MobileHeader } from '@/components/navigation/MobileHeader'
import { MobileMenu } from '@/components/navigation/MobileMenu'
import Navigation from '@/components/Navigation'

interface DashboardLayoutProps {
  children: ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  isAdmin?: boolean
}

export function DashboardLayout({ children, user, isAdmin = false }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top Navigation Header - fixed at top - desktop only */}
      <div className="hidden lg:block">
        <Navigation />
      </div>

      {/* Mobile Header - mobile only */}
      <div className="lg:hidden">
        <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />
      </div>

      {/* Desktop sidebar - fixed below nav */}
      <Sidebar user={user} isAdmin={isAdmin} />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        isAdmin={isAdmin}
      />

      {/* Main content area with left margin for sidebar on desktop, top margin for mobile header */}
      <main className="flex flex-1 flex-col pt-8 lg:pt-16 lg:ml-[241px]">
        {/* Page content */}
        <div className="flex-1 px-4 lg:px-4 lg:py-4">
          {children}
        </div>
      </main>
    </div>
  )
}
