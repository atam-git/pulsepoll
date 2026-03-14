import Link from 'next/link'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'default' | 'full'
  loading?: boolean
  href?: string
  className?: string
}

const variantStyles = {
  primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm hover:shadow-md',
  secondary: 'bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900 shadow-sm hover:shadow-md',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 hover:border-slate-400',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-base',
}

const roundedStyles = {
  default: 'rounded-lg',
  full: 'rounded-full',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'default',
  loading = false,
  disabled,
  href,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer'

  const focusRingColor = variant === 'destructive' ? 'focus:ring-red-500' : 'focus:ring-green-500'

  const disabledStyles = disabled || loading ? 'opacity-60 cursor-not-allowed' : ''

  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]} ${focusRingColor} ${disabledStyles} ${className}`

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    )
  }

  return (
    <button className={styles} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}
