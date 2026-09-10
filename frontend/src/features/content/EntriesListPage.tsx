import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Plus, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Badge, Button, Drawer, EmptyState, Input, PageHeader, PortalMenu, Select, Textarea, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { uid } from '@/lib/id'
import { delay } from '@/lib/delay'
import { getStore } from '@/store/useStore'
import { useCan } from '@/lib/permissions'
import type { MetaobjectEntry } from '@/types/parity'

async function saveEntry(entry: MetaobjectEntry): Promise<void> {
  await delay(300)
  getStore().upsertMetaobjectEntry(entry)
}

async function deleteEntry(id: string): Promise<void> {
  await delay(250)
  getStore().removeMetaobjectEntry(id)
}

export default function EntriesListPage() {
  const entries = useStore((s) => s.metaobjectEntries)
  const definitions = useStore((s) => s.metaobjectDefinitions)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [definitionFilter, setDefinitionFilter] = useState('')
  const [editing, setEditing] = useState<MetaobjectEntry | null>(null)
  const [isNew, setIsNew] = useState(false)
  const canEdit = useCan('products', 'edit')

  const definitionName = (id: string) => definitions.find((d) => d.id === id)?.name ?? 'Unknown'
  const definitionOf = (entry: MetaobjectEntry) => definitions.find((d) => d.id === entry.definitionId)

  const filtered = useMemo(
    () => entries.filter((e) => !definitionFilter || e.definitionId === definitionFilter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [entries, definitionFilter],
  )

  const openCreate = () => {
    const def = definitions[0]
    if (!def) {
      toast('No content definitions exist yet', { tone: 'warning' })
      return
    }
    setEditing({ id: uid('mod_e'), definitionId: def.id, fields: {}, status: 'draft', updatedAt: new Date().toISOString() })
    setIsNew(true)
  }

  const firstField = (e: MetaobjectEntry) => {
    const def = definitionOf(e)
    const key = def?.fields[0]?.key
    return key ? e.fields[key] || '—' : '—'
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="Content entries"
        subtitle="Structured content (metaobjects) reusable across your storefront — testimonials, FAQs, and more"
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<Plus size={13} />} onClick={openCreate}>
              Add entry
            </Button>
          ) : undefined
        }
        secondaryActions={
          <select
            value={definitionFilter}
            onChange={(e) => setDefinitionFilter(e.target.value)}
            aria-label="Filter by definition"
            className="h-8 cursor-pointer rounded-lg border border-[#c9c9c9] bg-surface px-2 text-[13px]"
          >
            <option value="">All definitions</option>
            {definitions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        }
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Boxes}
            heading={entries.length === 0 ? 'No content entries yet' : 'No entries match'}
            message="Entries give content teams a structured way to manage reusable content without editing pages."
            primaryAction={canEdit && entries.length === 0 ? { label: 'Add entry', onClick: openCreate } : undefined}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-[#fafafa] text-left text-xs text-text-muted">
                <th className="px-4 py-2 font-medium">Entry</th>
                <th className="px-4 py-2 font-medium">Definition</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Updated</th>
                <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="cursor-pointer hover:bg-surface-hover" onClick={() => { setEditing(structuredClone(e)); setIsNew(false) }}>
                  <td className="max-w-[320px] truncate px-4 py-2 font-medium">{firstField(e)}</td>
                  <td className="px-4 py-2 text-text-muted">{definitionName(e.definitionId)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={e.status === 'published' ? 'success' : 'warning'} dot>
                      {e.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{formatDate(e.updatedAt)}</td>
                  <td className="px-4 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                    <PortalMenu
                      align="right"
                      trigger={
                        <button aria-label="Entry actions" className="rounded p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
                          </svg>
                        </button>
                      }
                      items={[
                        { label: 'Edit', onClick: () => { setEditing(structuredClone(e)); setIsNew(false) } },
                        ...(canEdit
                          ? [{
                              label: 'Delete', icon: <Trash2 size={12} />, destructive: true,
                              onClick: () =>
                                confirm({
                                  title: 'Delete this entry?',
                                  body: 'Sections referencing it will stop showing this content.',
                                  confirmLabel: 'Delete',
                                  destructive: true,
                                  onConfirm: async () => {
                                    await deleteEntry(e.id)
                                    toast('Entry deleted', { tone: 'critical' })
                                  },
                                }),
                            }]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor drawer */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'Add entry' : 'Edit entry'}
        subtitle={editing ? definitionName(editing.definitionId) : undefined}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!editing) return
                await saveEntry(editing)
                toast(isNew ? 'Entry created' : 'Entry saved')
                setEditing(null)
                void navigate('/content/entries')
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <Select
              label="Definition"
              value={editing.definitionId}
              onChange={(e) => setEditing({ ...editing, definitionId: e.target.value, fields: {} })}
              options={definitions.map((d) => ({ label: d.name, value: d.id }))}
              disabled={!isNew}
            />
            {(definitionOf(editing)?.fields ?? []).map((f) =>
              f.type === 'multi_line_text' ? (
                <Textarea
                  key={f.key}
                  label={f.label}
                  rows={3}
                  value={editing.fields[f.key] ?? ''}
                  onChange={(e) => setEditing({ ...editing, fields: { ...editing.fields, [f.key]: e.target.value } })}
                  disabled={!canEdit}
                />
              ) : (
                <Input
                  key={f.key}
                  label={f.label + (f.type !== 'single_line_text' ? ` (${f.type})` : '')}
                  value={editing.fields[f.key] ?? ''}
                  onChange={(e) => setEditing({ ...editing, fields: { ...editing.fields, [f.key]: e.target.value } })}
                  disabled={!canEdit}
                />
              ),
            )}
            <Select
              label="Status"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as MetaobjectEntry['status'] })}
              options={[
                { label: 'Published', value: 'published' },
                { label: 'Draft', value: 'draft' },
              ]}
              disabled={!canEdit}
            />
            <p className="text-xs text-text-muted">
              Definition fields are configured in Settings → Metafields.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  )
}
