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
      className="group flex min-h-[260px] flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-primary-base hover:bg-primary-base"
    >
      {/* Top content */}
      <div>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-base/10 transition-colors duration-200 group-hover:bg-white/20">
          <Icon className="h-6 w-6 text-primary-base transition-colors duration-200 group-hover:text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 transition-colors duration-200 group-hover:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 transition-colors duration-200 group-hover:text-white/80">
          {description}
        </p>
      </div>

      {/* CTA link */}
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-base transition-colors duration-200 group-hover:text-white">
        <span>{linkText}</span>
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
