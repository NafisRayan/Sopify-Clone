import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui'

export function AppProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
