import { EmptyState, PageHeader } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

/** Intentional placeholder state (spec §41) — replaced as modules land. */
export default function ComingSoonPage({ module, icon }: { module: string; icon?: LucideIcon }) {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title={module} />
      <div className="rounded-xl border border-border bg-surface">
        <EmptyState
          icon={icon}
          heading={`${module} is being built`}
          message="This module is next in the implementation plan. Nothing is broken — it just hasn't shipped yet."
          primaryAction={{ label: 'Back to home', onClick: () => navigate('/') }}
        />
      </div>
    </div>
  )
}
