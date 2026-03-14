import { ComponentType } from 'react'

interface StatsCardProps {
  icon: ComponentType<{ className?: string }>
  iconBgColor: string
  label: string
  value: string | number
  description?: string
}

export function StatsCard({ icon: Icon, iconBgColor, label, value, description }: StatsCardProps) {
  return (
    <div className="rounded-lg bg-gray-100 p-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${iconBgColor}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
