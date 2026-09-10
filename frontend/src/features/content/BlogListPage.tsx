import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Newspaper, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { DataTable, type Column, type FilterDef } from '@/components/data-table/DataTable'
import { Badge, Button, Drawer, EmptyState, Input, PortalMenu, Textarea, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { createPost, deletePosts } from '@/services/contentService'
import { useCan } from '@/lib/permissions'
import type { BlogPost } from '@/types'

export default function BlogListPage() {
  const posts = useStore((s) => s.posts)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', excerpt: '', content: '' })
  const canEdit = useCan('products', 'edit')

  const filters: FilterDef<BlogPost>[] = [
    {
      key: 'status', label: 'Status', type: 'multiselect',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
      ],
      predicate: (p, v) => Array.isArray(v) && v.includes(p.status),
    },
  ]

  const columns: Column<BlogPost>[] = [
    {
      key: 'title', header: 'Post', sortValue: (p) => p.title.toLowerCase(),
      render: (p) => (
        <span className="flex items-center gap-3">
          {p.imageSrc && <img src={p.imageSrc} alt="" className="h-8 w-12 shrink-0 rounded-md border border-border object-cover" />}
          <span className="min-w-0">
            <span className="block truncate font-medium">{p.title}</span>
            <span className="block truncate text-xs text-text-muted">{p.excerpt}</span>
          </span>
        </span>
      ),
    },
    { key: 'author', header: 'Author', sortValue: (p) => p.author, render: (p) => p.author },
    {
      key: 'status', header: 'Status', sortValue: (p) => p.status,
      render: (p) => (
        <Badge tone={p.status === 'published' ? 'success' : p.status === 'scheduled' ? 'info' : 'warning'} dot>
          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'published', header: 'Published', sortValue: (p) => p.publishedAt ?? '',
      render: (p) => <span className="text-text-muted">{p.publishedAt ? formatDate(p.publishedAt) : '—'}</span>,
    },
  ]

  const submitCreate = async () => {
    if (!form.title.trim()) {
      toast('Give the post a title', { tone: 'critical' })
      return
    }
    const created = await createPost({
      title: form.title.trim(),
      excerpt: form.excerpt,
      contentHtml: `<p>${form.content}</p>`,
      status: 'draft',
    })
    toast('Post created as draft')
    setCreateOpen(false)
    setForm({ title: '', excerpt: '', content: '' })
    navigate(`/content/blog/${created.id}`)
  }

  return (
    <div>
      {confirmElement}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add blog post"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitCreate()}>Create</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <Textarea label="Content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
      </Drawer>

      <DataTable
        rows={posts}
        columns={columns}
        rowKey={(p) => p.id}
        searchKeys={(p) => [p.title, p.author, p.excerpt, ...p.tags]}
        searchPlaceholder="Search posts"
        filters={filters}
        initialSort={{ key: 'published', dir: 'desc' }}
        onRowClick={(p) => navigate(`/content/blog/${p.id}`)}
        hasAnyData={posts.length > 0}
        toolbarExtra={
          <Button size="sm" variant="primary" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)} disabled={!canEdit}>
            Add post
          </Button>
        }
        emptyNoData={
          <EmptyState
            icon={Newspaper}
            heading="No blog posts yet"
            message="Publish stories, guides, and news on your store's Journal."
            primaryAction={canEdit ? { label: 'Add post', onClick: () => setCreateOpen(true) } : undefined}
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
              { label: 'Open', onClick: () => navigate(`/content/blog/${p.id}`) },
              ...(canEdit
                ? [{
                    label: 'Delete', icon: <Trash2 size={13} />, destructive: true,
                    onClick: () =>
                      confirm({
                        title: `Delete ${p.title}?`,
                        body: 'The post will be removed from your Journal. This cannot be undone.',
                        confirmLabel: 'Delete',
                        destructive: true,
                        onConfirm: async () => {
                          await deletePosts([p.id])
                          toast('Post deleted', { tone: 'critical' })
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
