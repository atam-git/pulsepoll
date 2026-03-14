import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  icon?: ReactNode
  containerClassName?: string
}

export function Input({
  label,
  error,
  success,
  helperText,
  icon,
  containerClassName = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const baseInputStyles = 'w-full px-4 py-2.5 text-base font-normal transition-all duration-200'
  const borderStyles = error
    ? 'border-2 border-red-500'
    : success
      ? 'border-2 border-green-500'
      : 'border border-slate-300 hover:border-slate-400'
  const bgStyles = 'bg-white'
  const textStyles = 'text-slate-900 placeholder-slate-500'
  const focusStyles = error
    ? 'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200'
    : success
      ? 'focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200'
      : 'focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200'
  const disabledStyles = 'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed'

  const radiusStyles = 'rounded-lg'

  const inputClassName = `${baseInputStyles} ${borderStyles} ${bgStyles} ${textStyles} ${focusStyles} ${disabledStyles} ${radiusStyles}`

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input id={inputId} className={inputClassName} {...props} />
        {icon && <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">{icon}</div>}
      </div>
      {error && <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>}
      {success && !error && (
        <p className="mt-1.5 text-sm font-medium text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Success
        </p>
      )}
      {helperText && !error && !success && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
    </div>
  )
}
