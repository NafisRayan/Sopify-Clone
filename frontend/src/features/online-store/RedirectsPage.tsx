import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column } from '@/components/data-table/DataTable'
import { Badge, Button, Drawer, EmptyState, Input, PageHeader, PortalMenu, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { slugify } from '@/lib/validation'
import { getStore } from '@/store/useStore'
import { uid } from '@/lib/id'
import { delay } from '@/lib/delay'
import { useCan } from '@/lib/permissions'
import type { UrlRedirect } from '@/types/parity'

/** Redirects service inline (small, single-module) — Online store → URL redirects */
async function createRedirect(from: string, to: string): Promise<UrlRedirect> {
  await delay(250)
  const store = getStore()
  const normFrom = `/${slugify(from).replace(/^\//, '')}`
  if (store.redirects.some((r) => r.from === normFrom)) throw new Error('A redirect for this URL already exists')
  const redirect: UrlRedirect = { id: uid('red'), from: normFrom, to: to.trim(), createdAt: new Date().toISOString() }
  store.upsertRedirect(redirect)
  return redirect
}

async function updateRedirect(id: string, from: string, to: string): Promise<void> {
  await delay(250)
  const store = getStore()
  const r = store.redirects.find((x) => x.id === id)
  if (!r) throw new Error('Redirect not found')
  const normFrom = `/${slugify(from).replace(/^\//, '')}`
  if (store.redirects.some((x) => x.id !== id && x.from === normFrom)) throw new Error('A redirect for this URL already exists')
  store.upsertRedirect({ ...r, from: normFrom, to: to.trim() })
}

async function removeRedirect(id: string): Promise<void> {
  await delay(200)
  getStore().removeRedirect(id)
}

export default function RedirectsPage() {
  const redirects = useStore((s) => s.redirects)
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [editor, setEditor] = useState<{ mode: 'create' } | { mode: 'edit'; redirect: UrlRedirect } | null>(null)
  const [form, setForm] = useState({ from: '', to: '' })
  const canEdit = useCan('products', 'edit')

  const brokenCount = useMemo(
    () => redirects.filter((r) => !r.to.startsWith('/') && !r.to.startsWith('http')).length,
    [redirects],
  )

  const openCreate = () => {
    setForm({ from: '', to: '' })
    setEditor({ mode: 'create' })
  }
  const openEdit = (r: UrlRedirect) => {
    setForm({ from: r.from, to: r.to })
    setEditor({ mode: 'edit', redirect: r })
  }

  const save = async () => {
    if (!form.from.trim() || !form.to.trim()) {
      toast('Both URLs are required', { tone: 'critical' })
      return
    }
    try {
      if (editor?.mode === 'edit') {
        await updateRedirect(editor.redirect.id, form.from, form.to)
        toast('Redirect updated')
      } else {
        await createRedirect(form.from, form.to)
        toast('Redirect created')
      }
      setEditor(null)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save redirect', { tone: 'critical' })
    }
  }

  const columns: Column<UrlRedirect>[] = [
    {
      key: 'from', header: 'Redirect from', sortValue: (r) => r.from,
      render: (r) => <span className="font-mono text-[13px]">northstargoods.com{r.from}</span>,
    },
    {
      key: 'to', header: 'Redirect to', sortValue: (r) => r.to,
      render: (r) => (
        <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
          <ArrowRight size={11} />
          <span className="font-mono">{r.to.startsWith('http') ? r.to : `northstargoods.com${r.to}`}</span>
        </span>
      ),
    },
    {
      key: 'created', header: 'Added', sortValue: (r) => r.createdAt,
      render: (r) => <span className="text-text-muted">{formatDate(r.createdAt)}</span>,
    },
  ]

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="URL redirects"
        subtitle="Prevent broken links after changing URLs — redirects keep old links working"
        primaryAction={
          canEdit ? (
            <Button variant="primary" onClick={openCreate}>
              Create redirect
            </Button>
          ) : undefined
        }
      />

      {brokenCount > 0 && (
        <div className="mb-3">
          <Badge tone="warning" dot>
            {brokenCount} redirect{brokenCount === 1 ? '' : 's'} point to non-storefront URLs
          </Badge>
        </div>
      )}

      <DataTable
        rows={redirects}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={(r) => [r.from, r.to]}
        searchPlaceholder="Search redirects"
        initialSort={{ key: 'created', dir: 'desc' }}
        hasAnyData={redirects.length > 0}
        emptyNoData={
          <EmptyState
            heading="No redirects yet"
            message="When you change a page or product URL, add a redirect so customers' old links still work."
            primaryAction={canEdit ? { label: 'Create redirect', onClick: openCreate } : undefined}
          />
        }
        rowActions={(r) => (
          <PortalMenu
            align="right"
            trigger={
              <button aria-label={`Actions for ${r.from}`} className="rounded-md p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
            }
            items={[
              { label: 'Edit', onClick: () => openEdit(r), disabled: !canEdit },
              ...(canEdit
                ? [{
                    label: 'Delete', destructive: true,
                    onClick: () =>
                      confirm({
                        title: `Delete redirect ${r.from}?`,
                        body: 'The old URL will 404 again.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: async () => {
                          await removeRedirect(r.id)
                          toast('Redirect deleted', { tone: 'critical' })
                        },
                      }),
                  }]
                : []),
            ]}
          />
        )}
      />

      <Drawer
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'edit' ? 'Edit redirect' : 'Create redirect'}
        footer={
          <>
            <Button onClick={() => setEditor(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Redirect from"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            placeholder="/old-url"
            helpText="Only store URLs can be redirected from. It must start with /."
          />
          <Input
            label="Redirect to"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            placeholder="/new-url or https://…"
          />
        </div>
      </Drawer>
    </div>
  )
}
