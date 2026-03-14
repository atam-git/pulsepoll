import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 ${paddingMap[padding]} ${
        hover ? 'transition-shadow duration-200 hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
