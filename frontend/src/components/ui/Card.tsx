import type { ReactNode } from 'react'

export function Card({
  children,
  padding = true,
  className = '',
}: {
  children: ReactNode
  padding?: boolean
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface ${padding ? 'p-4 md:p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
      <div className="min-w-0">
        {title && <h2 className="text-sm font-semibold text-text">{title}</h2>}
        {subtitle && <div className="mt-0.5 text-xs text-text-muted">{subtitle}</div>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A titled section inside a card (Shopify "summary" style) */
export function CardSection({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`px-4 py-4 md:px-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h3 className="text-[13px] font-semibold text-text">{title}</h3>}
            {subtitle && <div className="mt-0.5 text-xs text-text-muted">{subtitle}</div>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

/** Rounded container whose sections are divided (like Polaris legacy card) */
export function DividedCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface [&>*+*]:border-t [&>*+*]:border-border">
      {children}
    </div>
  )
}
