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
    <div className="flex min-h-screen flex-col bg-slate-50">
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
      <main className="flex flex-1 flex-col pt-6 lg:pt-8 lg:ml-[241px]">
        {/* Page content */}
        <div className="flex-1 px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
