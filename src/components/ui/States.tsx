import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

/** Shopify-style empty state. Distinguishes "no data" vs "no results" (spec §53). */
export function EmptyState({
  icon: Icon,
  heading,
  message,
  primaryAction,
  secondaryAction,
  compact,
}: {
  icon?: LucideIcon
  heading: string
  message?: string
  primaryAction?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  compact?: boolean
}) {
  const IconCmp = Icon
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-6 py-10' : 'px-6 py-16'}`}>
      {IconCmp && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f1f1] text-text-muted">
          <IconCmp size={24} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-text">{heading}</h3>
      {message && <p className="mt-1 max-w-sm text-[13px] text-text-muted">{message}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {secondaryAction && (
            <Button size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button size="sm" variant="primary" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[#ededed] ${className}`} />
}

export function SkeletonRows({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? 'w-8' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function Banner({
  tone = 'info',
  title,
  children,
  onDismiss,
  action,
}: {
  tone?: 'info' | 'success' | 'warning' | 'critical'
  title?: ReactNode
  children?: ReactNode
  onDismiss?: () => void
  action?: ReactNode
}) {
  const tones = {
    info: 'bg-info-surface border-transparent text-info',
    success: 'bg-success-surface border-transparent text-[#1a5c31]',
    warning: 'bg-warning-surface-soft border-[#ecd489] text-warning',
    critical: 'bg-critical-surface border-transparent text-critical',
  }
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] ${tones[tone]}`} role="status">
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xs underline opacity-70 hover:opacity-100" aria-label="Dismiss">
          Dismiss
        </button>
      )}
    </div>
  )
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="tablist">
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
              active ? 'bg-[#e3e3e3] text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded px-1 text-[11px] ${active ? 'bg-[#d0d0d0]' : 'bg-[#f1f1f1]'}`}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
