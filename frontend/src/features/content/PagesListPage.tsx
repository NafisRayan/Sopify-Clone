import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column, type FilterDef } from '@/components/data-table/DataTable'
import { Badge, Button, Drawer, EmptyState, Input, PortalMenu, Textarea, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { createPage, deletePages } from '@/services/contentService'
import { useCan } from '@/lib/permissions'
import type { StorePage } from '@/types'

export default function PagesListPage() {
  const pages = useStore((s) => s.pages)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const canEdit = useCan('products', 'edit')

  const filters: FilterDef<StorePage>[] = [
    {
      key: 'status', label: 'Status', type: 'select',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
      predicate: (p, v) => p.status === v,
    },
  ]

  const columns: Column<StorePage>[] = [
    {
      key: 'title', header: 'Page', sortValue: (p) => p.title.toLowerCase(),
      render: (p) => (
        <span className="flex items-center gap-2.5">
          <FileText size={15} className="shrink-0 text-text-muted" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{p.title}</span>
            <span className="block truncate text-xs text-text-muted">/pages/{p.handle}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', sortValue: (p) => p.status,
      render: (p) => <Badge tone={p.status === 'published' ? 'success' : 'warning'} dot>{p.status === 'published' ? 'Published' : 'Draft'}</Badge>,
    },
    {
      key: 'created', header: 'Created', sortValue: (p) => p.createdAt,
      render: (p) => <span className="text-text-muted">{formatDate(p.createdAt)}</span>,
    },
    {
      key: 'updated', header: 'Updated', sortValue: (p) => p.updatedAt,
      render: (p) => <span className="text-text-muted">{formatDate(p.updatedAt)}</span>,
    },
  ]

  const submitCreate = async () => {
    if (!form.title.trim()) {
      toast('Give the page a title', { tone: 'critical' })
      return
    }
    try {
      const created = await createPage({ title: form.title.trim(), contentHtml: `<p>${form.content}</p>`, status: 'draft' })
      toast('Page created as draft')
      setCreateOpen(false)
      setForm({ title: '', content: '' })
      navigate(`/content/pages/${created.id}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to create page', { tone: 'critical' })
    }
  }

  return (
    <div>
      {confirmElement}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add page"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitCreate()}>Create</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frequently asked questions" />
          <Textarea label="Content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
      </Drawer>

      <DataTable
        rows={pages}
        columns={columns}
        rowKey={(p) => p.id}
        searchKeys={(p) => [p.title, p.handle]}
        searchPlaceholder="Search pages"
        filters={filters}
        initialSort={{ key: 'title', dir: 'asc' }}
        onRowClick={(p) => navigate(`/content/pages/${p.id}`)}
        hasAnyData={pages.length > 0}
        toolbarExtra={
          <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)} disabled={!canEdit}>
            Add page
          </Button>
        }
        emptyNoData={
          <EmptyState
            icon={FileText}
            heading="No pages yet"
            message="Pages like About, Contact, and FAQ live in your storefront navigation."
            primaryAction={canEdit ? { label: 'Add page', onClick: () => setCreateOpen(true) } : undefined}
          />
        }
        rowActions={(p) => (
          <PortalMenu
            align="right"
            trigger={
              <button aria-label={`Actions for ${p.title}`} className="rounded-md p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                <MoreVertical size={15} />
              </button>
            }
            items={[
              { label: 'Open', onClick: () => navigate(`/content/pages/${p.id}`) },
              ...(canEdit
                ? [{
                    label: 'Delete', icon: <Trash2 size={13} />, destructive: true,
                    onClick: () =>
                      confirm({
                        title: `Delete ${p.title}?`,
                        body: 'Any storefront links to this page will stop working.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: async () => {
                          await deletePages([p.id])
                          toast('Page deleted', { tone: 'critical' })
                        },
                      }),
                  }]
                : []),
            ]}
          />
        )}
      />
    </div>
  )
}
