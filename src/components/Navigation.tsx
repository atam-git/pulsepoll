'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Hide navigation on vote and results pages only (they don't use DashboardLayout)
  if (
    pathname?.startsWith('/vote/') ||
    pathname?.startsWith('/results/')
  ) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/Connect Nigeria (1).png" 
              alt="PulsePoll" 
              className="h-8 sm:h-10 object-contain"
            />
          </Link>
          
          {/* Auth Buttons or Logout Icon */}
          {status === 'loading' ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : !session ? (
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/auth/login" 
                className="text-sm sm:text-base font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors shadow-sm hover:shadow-md"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
