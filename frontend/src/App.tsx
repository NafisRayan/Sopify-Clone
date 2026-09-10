import { AppRoutes } from '@/app/AppRoutes'
import { AppProviders } from '@/app/providers'
import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import { IS_REMOTE, refreshFromServer } from '@/services/api'

export default function App() {
  const setGlobalSearchOpen = useUiStore((s) => s.setGlobalSearchOpen)

  // Global keyboard shortcuts (spec §57): "/" or ⌘K/Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault()
        setGlobalSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setGlobalSearchOpen])

  // remote mode: pull server truth on boot and periodically reconcile
  useEffect(() => {
    if (!IS_REMOTE) return
    void refreshFromServer()
    const onFocus = () => void refreshFromServer()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
