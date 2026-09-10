import type { ReactNode } from 'react'

export type BadgeTone =
  | 'success'
  | 'critical'
  | 'warning'
  | 'info'
  | 'attention'
  | 'neutral'
  | 'highlight'

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-success-surface text-[#1a5c31]',
  critical: 'bg-critical-surface text-critical',
  warning: 'bg-warning-surface-soft text-warning',
  info: 'bg-info-surface text-info',
  attention: 'bg-attention-surface text-attention',
  neutral: 'bg-[#f1f1f1] text-text-muted',
  highlight: 'bg-highlight text-[#5b3ba8]',
}

const dotClasses: Record<BadgeTone, string> = {
  success: 'bg-[#29845a]',
  critical: 'bg-critical-strong',
  warning: 'bg-[#c47f00]',
  info: 'bg-[#196ec2]',
  attention: 'bg-[#9c7a12]',
  neutral: 'bg-[#8a8a8a]',
  highlight: 'bg-[#7a52c7]',
}

export function Badge({
  tone = 'neutral',
  dot,
  children,
  progress,
}: {
  tone?: BadgeTone
  dot?: boolean
  children: ReactNode
  /** adds "Incomplete"/"Complete" style semantics like Polaris badges */
  progress?: 'incomplete' | 'complete' | 'partiallyComplete'
}) {
  const label =
    progress === 'complete' ? `Complete: ${typeof children === 'string' ? children : ''}` : undefined
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
      aria-label={label}
    >
      {dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />}
      {children}
    </span>
  )
}
