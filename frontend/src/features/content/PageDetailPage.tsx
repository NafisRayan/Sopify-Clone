import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button, Card, CardHeader, CardSection, DividedCard, EmptyState, Input, PageHeader, Select, Textarea, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { slugify } from '@/lib/validation'
import { deletePages, updatePage } from '@/services/contentService'
import { useCan } from '@/lib/permissions'
import type { StorePage } from '@/types'

export default function PageDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const page = useStore((s) => s.pages.find((p) => p.id === id))
  const [draft, setDraft] = useState<StorePage | null>(null)
  const [saving, setSaving] = useState(false)
  const canEdit = useCan('products', 'edit')

  useEffect(() => {
    setDraft(page ? structuredClone(page) : null)
  }, [page])

  if (!page) {
    return (
      <div>
        <PageHeader title="Page not found" backTo="/content/pages" backLabel="Pages" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Page not found" message="It may have been deleted." primaryAction={{ label: 'Back to pages', onClick: () => navigate('/content/pages') }} />
        </div>
      </div>
    )
  }
  if (!draft) return null

  const patch = (p: Partial<StorePage>) => setDraft((prev) => (prev ? { ...prev, ...p } : prev))

  const save = async () => {
    if (!draft.title.trim()) {
      toast('Title is required', { tone: 'critical' })
      return
    }
    setSaving(true)
    try {
      await updatePage(draft.id, { ...draft, title: draft.title.trim(), handle: slugify(draft.handle) })
      toast('Page saved')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', { tone: 'critical' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title={draft.title || 'Untitled'}
        subtitle={`Last updated ${formatDate(draft.updatedAt)}`}
        backTo="/content/pages"
        backLabel="Pages"
        primaryAction={<Button variant="primary" loading={saving} onClick={() => void save()} disabled={!canEdit}>Save</Button>}
        secondaryActions={
          canEdit ? (
            <Button
              variant="destructive"
              onClick={() =>
                confirm({
                  title: `Delete ${draft.title}?`,
                  body: 'Any storefront links to this page will stop working.',
                  confirmLabel: 'Delete',
                  destructive: true,
                  onConfirm: async () => {
                    await deletePages([draft.id])
                    toast('Page deleted', { tone: 'critical' })
                    navigate('/content/pages')
                  },
                })
              }
            >
              Delete
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padding={false}>
            <CardHeader title="Page" />
            <CardSection>
              <div className="space-y-3">
                <Input label="Title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} disabled={!canEdit} />
                <Textarea
                  label="Content"
                  rows={10}
                  value={draft.contentHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<[^>]+>/g, '')}
                  onChange={(e) => patch({ contentHtml: e.target.value.split(/\n{2,}/).map((para) => `<p>${para}</p>`).join('') })}
                  disabled={!canEdit}
                  helpText="Blank lines start a new paragraph. HTML is supported."
                />
              </div>
            </CardSection>
          </Card>

          <DividedCard>
            <CardHeader title="Preview" />
            <CardSection>
              <div className="prose-product max-w-none" dangerouslySetInnerHTML={{ __html: draft.contentHtml }} />
            </CardSection>
          </DividedCard>
        </div>

        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader title="Visibility" />
            <CardSection>
              <Select
                label="Status"
                value={draft.status}
                onChange={(e) => patch({ status: e.target.value as StorePage['status'] })}
                options={[
                  { label: 'Published', value: 'published' },
                  { label: 'Draft', value: 'draft' },
                ]}
                disabled={!canEdit}
              />
              <p className="mt-2 text-xs text-text-muted">northstargoods.com/pages/{draft.handle}</p>
            </CardSection>
          </Card>

          <Card padding={false}>
            <CardHeader title="Search engine listing" />
            <CardSection>
              <div className="space-y-3">
                <Input label="SEO title" value={draft.seoTitle ?? ''} onChange={(e) => patch({ seoTitle: e.target.value })} disabled={!canEdit} />
                <Textarea label="SEO description" rows={3} value={draft.seoDescription ?? ''} onChange={(e) => patch({ seoDescription: e.target.value })} disabled={!canEdit} />
                <Input label="Handle" value={draft.handle} onChange={(e) => patch({ handle: slugify(e.target.value) })} disabled={!canEdit} />
              </div>
            </CardSection>
          </Card>
        </div>
      </div>
    </div>
  )
}
