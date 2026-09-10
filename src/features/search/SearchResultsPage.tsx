import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { PageHeader, EmptyState } from '@/components/ui'
import { globalSearch } from '@/lib/search'
import { useStore } from '@/store/useStore'

/** Full-page search results (deep-linkable, mirrors the ⌘K palette) */
export default function SearchResultsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') ?? ''
  const state = useStore()
  const groups = globalSearch(q, state)

  return (
    <div>
      <PageHeader
        title={`Search results for “${q}”`}
        subtitle={`${groups.reduce((s, g) => s + g.results.length, 0)} matches`}
        backTo="/"
        backLabel="Home"
      />
      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            heading="No results found"
            message="Try a different search term."
            primaryAction={{ label: 'Back to home', onClick: () => navigate('/') }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.type} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-4 py-2.5 text-[13px] font-semibold">{g.label}</div>
              <ul className="divide-y divide-border">
                {g.results.map((r) => (
                  <li key={r.id}>
                    <Link to={r.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{r.title}</span>
                        <span className="block truncate text-xs text-text-muted">{r.subtitle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
