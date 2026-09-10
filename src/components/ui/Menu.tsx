import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscape } from '@/hooks'

export interface MenuItemDef {
  label: string
  icon?: ReactNode
  destructive?: boolean
  disabled?: boolean
  onClick?: () => void
  separatorBefore?: boolean
}

/** Lightweight popover menu used for row actions and overflow menus */
export function Menu({
  trigger,
  items,
  align = 'left',
}: {
  trigger: ReactNode
  items: MenuItemDef[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEscape(() => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <div
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.separatorBefore && i > 0 && <div className="my-1 border-t border-border" />}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  if (item.disabled) return
                  setOpen(false)
                  item.onClick?.()
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 ${
                  item.destructive ? 'text-critical-strong' : 'text-text'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Simple non-modal popover anchored under the trigger */
export function Popover({
  trigger,
  children,
  align = 'left',
  panelClassName = 'w-72',
}: {
  trigger: ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEscape(() => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-40 mt-1.5 rounded-xl border border-border bg-surface p-3 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

/** Portal-based popover variant for tables/overflows that clip */
export function PortalMenu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: ReactNode
  items: MenuItemDef[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>()
  const ref = useRef<HTMLDivElement>(null)
  useEscape(() => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div
      className="relative inline-block"
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        if (!open) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          setPos({
            top: rect.bottom + 4,
            left: align === 'left' ? rect.left : undefined,
            right: align === 'right' ? window.innerWidth - rect.right : undefined,
          })
        }
        setOpen((v) => !v)
      }}
    >
      {trigger}
      {open &&
        pos &&
        createPortal(
          <div
            role="menu"
            style={{ top: pos.top, left: pos.left, right: pos.right }}
            className="fixed z-50 min-w-[180px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg"
          >
            {items.map((item, i) => (
              <div key={i}>
                {item.separatorBefore && i > 0 && <div className="my-1 border-t border-border" />}
                <button
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (item.disabled) return
                    setOpen(false)
                    item.onClick?.()
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 ${
                    item.destructive ? 'text-critical-strong' : 'text-text'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
