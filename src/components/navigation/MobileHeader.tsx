'use client'

import Link from 'next/link'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface MobileHeaderProps {
  onMenuToggle: () => void
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex min-h-[60px] items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
      <Link href="/">
        <img
          alt="PulsePoll logo"
          width={106}
          height={38}
          src="/Connect Nigeria (1).png"
          className="h-[38px] w-[106px] object-contain"
        />
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
    </header>
  )
}
