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
    <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg ${iconBgColor} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 line-clamp-1">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
