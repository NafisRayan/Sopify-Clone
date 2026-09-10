import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost-dark'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  /** visually hides the label, keeps it for a11y */
  iconOnly?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent shadow-[0_1px_0_rgba(0,0,0,0.12)]',
  secondary:
    'bg-surface text-text border border-[#d0d0d0] hover:bg-surface-hover hover:border-border-strong',
  tertiary: 'bg-transparent text-accent hover:bg-surface-hover border border-transparent',
  destructive: 'bg-surface text-critical-strong border border-[#e0a19d] hover:bg-critical-surface',
  'ghost-dark': 'bg-transparent text-text-on-dark hover:bg-surface-dark-hover border border-transparent',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2 gap-1 text-xs rounded-md',
  md: 'h-8 px-3 gap-1.5 text-[13px] rounded-lg',
  lg: 'h-9 px-4 gap-2 text-sm rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, iconOnly, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${
        iconOnly ? 'aspect-square px-0' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : icon}
      {children && <span className={iconOnly ? 'sr-only' : ''}>{children}</span>}
    </button>
  )
})
