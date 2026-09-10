import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Modal, Drawer } from './Overlays'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      tone={destructive ? 'critical' : undefined}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'primary' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className={destructive ? 'bg-critical-strong hover:bg-[#a02510]' : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[13px] text-text-muted">{body}</div>
    </Modal>
  )
}

/** Generic destructive-confirm hook: confirm() then run */
export function useConfirm() {
  const [state, setState] = useState<{
    title: string
    body: ReactNode
    confirmLabel?: string
    destructive?: boolean
    onConfirm: () => void | Promise<void>
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = (opts: {
    title: string
    body: ReactNode
    confirmLabel?: string
    destructive?: boolean
    onConfirm: () => void | Promise<void>
  }) => setState(opts)

  const element = (
    <ConfirmDialog
      open={!!state}
      onClose={() => setState(null)}
      title={state?.title ?? ''}
      body={state?.body ?? ''}
      confirmLabel={state?.confirmLabel}
      destructive={state?.destructive}
      loading={loading}
      onConfirm={async () => {
        if (!state) return
        setLoading(true)
        try {
          await state.onConfirm()
        } finally {
          setLoading(false)
          setState(null)
        }
      }}
    />
  )

  return { confirm, confirmElement: element }
}

// ─── Page header ───────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel,
  primaryAction,
  secondaryActions,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  backTo?: string
  backLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  children?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="mb-4">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="mb-1.5 flex items-center gap-0.5 text-xs font-medium text-text-muted hover:text-text"
        >
          <ChevronLeft size={13} />
          {backLabel ?? 'Back'}
        </button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-6 text-text">{title}</h1>
          {subtitle && <div className="mt-0.5 text-xs text-text-muted">{subtitle}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      </div>
      {children}
    </header>
  )
}

// Re-exports so features can import modal primitives from one place
export { Modal, Drawer }
