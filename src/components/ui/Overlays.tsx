import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useEscape } from '@/hooks'

/** Shared overlay + scroll-lock + ESC + initial focus behavior */
function useOverlay(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEscape(onClose)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // focus the first focusable element
    const t = setTimeout(() => {
      const focusable = containerRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button:not([data-no-focus]), [href], [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 30)
    return () => {
      document.body.style.overflow = previous
      clearTimeout(t)
    }
  }, [])
  return containerRef
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  tone,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: keyof typeof modalSizes
  /** 'critical' renders a red header accent, for destructive confirms */
  tone?: 'critical'
}) {
  const containerRef = useOverlay(onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" onClick={onClose} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`relative w-full ${modalSizes[size]} rounded-xl bg-surface shadow-2xl`}
      >
        <div
          className={`flex items-center justify-between rounded-t-xl px-4 py-3 ${
            tone === 'critical' ? 'bg-critical-surface' : ''
          }`}
        >
          <h2 className={`text-sm font-semibold ${tone === 'critical' ? 'text-critical' : 'text-text'}`}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            data-no-focus
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-4 py-4 scroll-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  const containerRef = useOverlay(onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" onClick={onClose} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`absolute inset-y-0 right-0 flex w-full ${width} animate-[slide-in_.18s_ease-out] flex-col bg-surface shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-text">{title}</h2>
            {subtitle && <div className="mt-0.5 text-xs text-text-muted">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            data-no-focus
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 scroll-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{footer}</div>}
      </div>
      <style>{`@keyframes slide-in { from { transform: translateX(24px); opacity: .6 } to { transform: translateX(0); opacity: 1 } }`}</style>
    </div>,
    document.body,
  )
}
