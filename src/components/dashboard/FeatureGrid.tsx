import { ComponentType } from 'react'
import { FeatureCard } from './FeatureCard'

interface Feature {
  id: string
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  linkText: string
  linkHref: string
}

interface FeatureGridProps {
  features: Feature[]
}

export function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {features.map((feature) => (
        <FeatureCard
          key={feature.id}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          linkText={feature.linkText}
          linkHref={feature.linkHref}
        />
      ))}
    </div>
  )
}
