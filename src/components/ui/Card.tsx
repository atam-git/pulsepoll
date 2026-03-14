import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  elevated?: boolean
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className = '', padding = 'md', hover = false, elevated = false }: CardProps) {
  const shadowClass = elevated ? 'shadow-lg' : 'shadow-sm'
  const hoverClass = hover ? 'transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]' : 'transition-shadow duration-300'

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 ${paddingMap[padding]} ${shadowClass} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  )
}
