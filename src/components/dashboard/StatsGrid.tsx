import { ComponentType } from 'react'
import { StatsCard } from './StatsCard'

interface StatItem {
  id: string
  icon: ComponentType<{ className?: string }>
  iconBgColor: string
  label: string
  value: string | number
  description?: string
}

interface StatsGridProps {
  stats: StatItem[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard
          key={stat.id}
          icon={stat.icon}
          iconBgColor={stat.iconBgColor}
          label={stat.label}
          value={stat.value}
          description={stat.description}
        />
      ))}
    </div>
  )
}
