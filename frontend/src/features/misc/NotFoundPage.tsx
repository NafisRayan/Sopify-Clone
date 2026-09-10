import { useNavigate } from 'react-router-dom'
import { EmptyState, PageHeader } from '@/components/ui'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Page not found" />
      <div className="rounded-xl border border-border bg-surface">
        <EmptyState
          heading="This page doesn't exist"
          message="The page you were looking for may have been moved or deleted."
          primaryAction={{ label: 'Go to home', onClick: () => navigate('/') }}
        />
      </div>
    </div>
  )
}
