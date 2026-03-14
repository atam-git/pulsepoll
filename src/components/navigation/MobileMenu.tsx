'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import {
  HomeIcon,
  ChartBarIcon,
  PlusCircleIcon,
  FolderIcon,
  Cog6ToothIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  user?: {
    name?: string | null
    email?: string | null
  }
  isAdmin?: boolean
}

const userNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Polls', href: '/polls', icon: FolderIcon },
  { label: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { label: 'Share & Embed', href: '/share', icon: ShareIcon },
  { label: 'Create Poll', href: '/poll/create', icon: PlusCircleIcon },
]

const adminNavItems = [
  { label: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
  { label: 'Manage Users', href: '/admin/users', icon: Cog6ToothIcon },
  { label: 'Manage Polls', href: '/admin/polls', icon: ChartBarIcon },
  { label: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
]

export function MobileMenu({ isOpen, onClose, user, isAdmin = false }: MobileMenuProps) {
  const pathname = usePathname()
  const navItems = isAdmin ? adminNavItems : userNavItems

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href) ?? false
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu panel */}
      <div className="fixed right-0 top-0 h-full w-[280px] bg-white shadow-xl animate-slide-in-right">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            {user && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm flex-shrink-0">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {user.name || 'User'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user.email || ''}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={() => {
                signOut()
                onClose()
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
