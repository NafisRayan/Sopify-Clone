import { AppRoutes } from '@/app/AppRoutes'
import { AppProviders } from '@/app/providers'
import { useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'

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

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}
