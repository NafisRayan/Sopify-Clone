import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

type ToastTone = 'success' | 'critical' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  tone: ToastTone
  action?: { label: string; onClick: () => void }
}

interface ToastContextValue {
  toast: (message: string, opts?: { tone?: ToastTone; action?: Toast['action'] }) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const toneIcon: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={15} className="text-[#7ee2b8]" />,
  critical: <XCircle size={15} className="text-[#ffb2a6]" />,
  warning: <AlertTriangle size={15} className="text-[#ffdc7a]" />,
  info: <Info size={15} className="text-[#9bd3ff]" />,
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const toast = useCallback<ToastContextValue['toast']>(
    (message, opts) => {
      const id = nextId++
      const t: Toast = { id, message, tone: opts?.tone ?? 'success', action: opts?.action }
      setToasts((list) => [...list.slice(-2), t]) // max 3 stacked
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4000),
      )
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-atomic="false"
          className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex w-auto min-w-[240px] max-w-full items-center gap-2 rounded-lg bg-[#1a1a1a] py-2 pl-3 pr-2 text-[13px] text-white shadow-lg animate-[toast-in_.15s_ease-out]"
              role="status"
            >
              {toneIcon[t.tone]}
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick()
                    dismiss(t.id)
                  }}
                  className="rounded px-1.5 py-0.5 text-xs font-medium text-[#7cc6ff] hover:bg-[#303030]"
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
      <style>{`@keyframes toast-in { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </ToastContext.Provider>
  )
}
