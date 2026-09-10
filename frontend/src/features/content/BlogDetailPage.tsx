import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Badge, Button, Card, CardHeader, CardSection, DividedCard, EmptyState, Input, PageHeader, Select, TagInput, Textarea, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { updatePost } from '@/services/contentService'
import { useCan } from '@/lib/permissions'
import type { BlogPost } from '@/types'

export default function BlogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const post = useStore((s) => s.posts.find((p) => p.id === id))
  const [draft, setDraft] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const canEdit = useCan('products', 'edit')

  useEffect(() => {
    setDraft(post ? structuredClone(post) : null)
  }, [post])

  if (!post) {
    return (
      <div>
        <PageHeader title="Post not found" backTo="/content/blog" backLabel="Blog" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState heading="Post not found" message="It may have been deleted." primaryAction={{ label: 'Back to blog', onClick: () => navigate('/content/blog') }} />
        </div>
      </div>
    )
  }
  if (!draft) return null

  const patch = (p: Partial<BlogPost>) => setDraft((prev) => (prev ? { ...prev, ...p } : prev))

  const save = async () => {
    if (!draft.title.trim()) {
      toast('Title is required', { tone: 'critical' })
      return
    }
    setSaving(true)
    try {
      await updatePost(draft.id, draft)
      toast('Post saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={draft.title || 'Untitled post'}
        subtitle={`${draft.author} · ${draft.publishedAt ? formatDate(draft.publishedAt) : 'not published'}`}
        backTo="/content/blog"
        backLabel="Blog"
        primaryAction={<Button variant="primary" loading={saving} onClick={() => void save()} disabled={!canEdit}>Save</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padding={false}>
            <CardHeader title="Post" />
            <CardSection>
              <div className="space-y-3">
                <Input label="Title" value={draft.title} onChange={(e) => patch({ title: e.target.value })} disabled={!canEdit} />
                <Input label="Excerpt" value={draft.excerpt} onChange={(e) => patch({ excerpt: e.target.value })} disabled={!canEdit} helpText="Shown on the blog index" />
                <Textarea
                  label="Content"
                  rows={12}
                  value={draft.contentHtml.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<[^>]+>/g, '')}
                  onChange={(e) => patch({ contentHtml: e.target.value.split(/\n{2,}/).map((para) => `<p>${para}</p>`).join('') })}
                  disabled={!canEdit}
                />
              </div>
            </CardSection>
          </Card>

          {draft.imageSrc && (
            <DividedCard>
              <CardHeader title="Featured image" />
              <CardSection>
                <img src={draft.imageSrc} alt="" className="max-h-56 rounded-lg border border-border object-cover" />
              </CardSection>
            </DividedCard>
          )}
        </div>

        <div className="space-y-4">
          <Card padding={false}>
            <CardHeader title="Publishing" />
            <CardSection>
              <div className="space-y-3">
                <Select
                  label="Status"
                  value={draft.status}
                  onChange={(e) => patch({ status: e.target.value as BlogPost['status'] })}
                  options={[
                    { label: 'Published', value: 'published' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Scheduled', value: 'scheduled' },
                  ]}
                  disabled={!canEdit}
                />
                <Input
                  label="Publish date"
                  type="date"
                  value={draft.publishedAt ? draft.publishedAt.slice(0, 10) : ''}
                  onChange={(e) => patch({ publishedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  disabled={!canEdit}
                />
                <div>
                  <span className="mb-1 block text-xs font-medium">Tags</span>
                  <TagInput value={draft.tags} onChange={(tags) => patch({ tags })} suggestions={['guides', 'stories', 'care', 'makers']} />
                </div>
                <Input label="Author" value={draft.author} onChange={(e) => patch({ author: e.target.value })} disabled={!canEdit} />
              </div>
            </CardSection>
          </Card>

          <Card>
            <h3 className="text-[13px] font-semibold">Preview</h3>
            <div className="prose-product mt-2 max-h-64 overflow-y-auto scroll-thin" dangerouslySetInnerHTML={{ __html: draft.contentHtml }} />
            <div className="mt-2 flex gap-1.5">
              {draft.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
