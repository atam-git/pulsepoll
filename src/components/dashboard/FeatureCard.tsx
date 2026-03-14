import Link from 'next/link'
import { ComponentType } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

interface FeatureCardProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  linkText: string
  linkHref: string
}

export function FeatureCard({ icon: Icon, title, description, linkText, linkHref }: FeatureCardProps) {
  return (
    <Link
      href={linkHref}
      className="group flex min-h-[280px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-green-500 hover:bg-green-600"
    >
      {/* Top content */}
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 group-hover:bg-white/20 transition-all duration-300">
          <Icon className="h-7 w-7 text-green-600 group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors duration-300">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 group-hover:text-white/90 transition-colors duration-300">
          {description}
        </p>
      </div>

      {/* CTA link */}
      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-green-600 group-hover:text-white transition-colors duration-300">
        <span>{linkText}</span>
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2" />
      </div>
    </Link>
  )
}
