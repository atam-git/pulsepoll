'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ChartBarIcon,
  PlusCircleIcon,
  FolderIcon,
  Cog6ToothIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
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

export function Sidebar({ user, isAdmin = false }: SidebarProps) {
  const pathname = usePathname()
  const navItems = isAdmin ? adminNavItems : userNavItems

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href) ?? false
  }

  return (
    <aside className="custom-scrollbar fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-[241px] flex-col border-r border-gray-200 bg-white shadow-lg max-lg:hidden">
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-semibold text-sm">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.name || 'User'}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user.email || ''}
              </p>
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </div>
    </aside>
  )
}
