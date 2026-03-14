import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  elevated?: boolean
  variant?: 'default' | 'outlined' | 'elevated'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const shadowMap = {
  default: 'shadow-sm',
  outlined: 'shadow-none',
  elevated: 'shadow-lg',
}

const borderMap = {
  default: 'border border-slate-200',
  outlined: 'border-2 border-slate-200',
  elevated: 'border border-slate-100',
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  elevated = false,
  variant = 'default',
}: CardProps) {
  // Support legacy elevated prop
  const finalVariant = elevated ? 'elevated' : variant
  const shadowClass = shadowMap[finalVariant]
  const borderClass = borderMap[finalVariant]
  const hoverClass = hover
    ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-1'
    : 'transition-shadow duration-200'

  return (
    <div
      className={`bg-white rounded-xl ${borderClass} ${paddingMap[padding]} ${shadowClass} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  )
}
