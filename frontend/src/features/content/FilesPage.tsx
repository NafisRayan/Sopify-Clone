import { useState } from 'react'
import { FileText, Film, Grid2X2, ImageIcon, List, MoreVertical, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  Badge, Button, Card, Drawer, EmptyState, Input, Modal, PageHeader, PortalMenu, Textarea,
  useConfirm, useToast,
} from '@/components/ui'
import { formatDate, formatFileSize } from '@/lib/format'
import { addFileByUrl, deleteFiles, renameFile, setFileAlt } from '@/services/contentService'
import { useCan } from '@/lib/permissions'
import type { FileAsset } from '@/types'

const typeIcon = { image: ImageIcon, document: FileText, video: Film }

export default function FilesPage() {
  const files = useStore((s) => s.files)
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [renaming, setRenaming] = useState<FileAsset | null>(null)
  const [details, setDetails] = useState<FileAsset | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [altValue, setAltValue] = useState('')
  const canEdit = useCan('products', 'edit')

  const filtered = files
    .filter((f) => !typeFilter || f.type === typeFilter)
    .filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const openRename = (f: FileAsset) => {
    setRenameValue(f.name)
    setAltValue(f.alt ?? '')
    setRenaming(f)
  }

  const bulkDelete = () =>
    confirm({
      title: `Delete ${selected.size} file${selected.size === 1 ? '' : 's'}?`,
      body: 'Files used by products or blog posts will lose their images. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await deleteFiles([...selected])
        toast(`${selected.size} file${selected.size === 1 ? '' : 's'} deleted`, { tone: 'critical' })
        setSelected(new Set())
      },
    })

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="Files"
        subtitle={`${files.length} asset${files.length === 1 ? '' : 's'} · used by products, collections and blog posts`}
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<Upload size={13} />} onClick={() => setUploadOpen(true)}>
              Upload file
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files"
          aria-label="Search files"
          className="h-8 w-full max-w-xs rounded-lg border border-[#c9c9c9] bg-[#f5f5f5] px-3 text-[13px] focus:border-accent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by type"
          className="h-8 cursor-pointer rounded-lg border border-[#c9c9c9] bg-surface px-2 text-[13px]"
        >
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="document">Documents</option>
          <option value="video">Videos</option>
        </select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
          <button
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
            className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-[#e3e3e3] text-text' : 'text-text-muted'}`}
          >
            <Grid2X2 size={14} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
            className={`rounded-md p-1.5 ${view === 'list' ? 'bg-[#e3e3e3] text-text' : 'text-text-muted'}`}
          >
            <List size={14} />
          </button>
        </div>
        {selected.size > 0 && (
          <Button size="sm" variant="destructive" icon={<Trash2 size={12} />} onClick={bulkDelete}>
            Delete ({selected.size})
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={ImageIcon}
            heading={files.length === 0 ? 'No files yet' : 'No files match'}
            message={files.length === 0 ? 'Upload images and documents to use across your store.' : 'Try a different search or filter.'}
            primaryAction={files.length === 0 && canEdit ? { label: 'Upload file', onClick: () => setUploadOpen(true) } : undefined}
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {filtered.map((f) => {
            const Icon = typeIcon[f.type]
            return (
              <Card key={f.id} padding={false} className={`group relative cursor-pointer ${selected.has(f.id) ? 'ring-2 ring-accent' : ''}`}>
                <div
                  className="aspect-square overflow-hidden rounded-t-xl bg-[#f7f7f7]"
                  onClick={() => (canEdit ? toggle(f.id) : setDetails(f))}
                  role="checkbox"
                  aria-checked={selected.has(f.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setDetails(f)}
                >
                  {f.type === 'image' && f.src ? (
                    <img src={f.src} alt={f.alt ?? f.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-text-muted">
                      <Icon size={22} strokeWidth={1.5} />
                      <span className="px-2 text-center text-[10px] uppercase tracking-wide">{f.type}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium" title={f.name}>{f.name}</span>
                    <span className="block text-[10px] text-text-muted">{formatFileSize(f.sizeKb)}</span>
                  </span>
                  <PortalMenu
                    align="right"
                    trigger={
                      <button aria-label={`Actions for ${f.name}`} className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text">
                        <MoreVertical size={13} />
                      </button>
                    }
                    items={[
                      { label: 'View details', onClick: () => setDetails(f) },
                      { label: 'Rename', icon: <Pencil size={12} />, onClick: () => openRename(f), disabled: !canEdit },
                      ...(canEdit
                        ? [{
                            label: 'Delete', icon: <Trash2 size={12} />, destructive: true,
                            onClick: () =>
                              confirm({
                                title: `Delete ${f.name}?`,
                                body: 'Products and posts using this file will lose it.',
                                confirmLabel: 'Delete',
                                destructive: true,
                                onConfirm: async () => {
                                  await deleteFiles([f.id])
                                  toast('File deleted', { tone: 'critical' })
                                },
                              }),
                          }]
                        : []),
                    ]}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-[#fafafa] text-left text-xs text-text-muted">
                <th className="px-4 py-2"><span className="sr-only">Select</span></th>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 text-right font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Uploaded</th>
                <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((f) => {
                const Icon = typeIcon[f.type]
                return (
                  <tr key={f.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-2">
                      {canEdit && (
                        <input type="checkbox" className="h-4 w-4 accent-[#303030]" checked={selected.has(f.id)} onChange={() => toggle(f.id)} aria-label={`Select ${f.name}`} />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button className="flex items-center gap-2.5 text-left" onClick={() => setDetails(f)}>
                        {f.type === 'image' && f.src ? (
                          <img src={f.src} alt="" className="h-8 w-8 rounded-md border border-border object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f1f1f1]"><Icon size={14} className="text-text-muted" /></span>
                        )}
                        <span className="font-medium">{f.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-2"><Badge tone={f.type === 'image' ? 'info' : f.type === 'video' ? 'highlight' : 'neutral'}>{f.type}</Badge></td>
                    <td className="px-4 py-2 text-right text-text-muted">{formatFileSize(f.sizeKb)}</td>
                    <td className="px-4 py-2 text-text-muted">{formatDate(f.uploadedAt)}</td>
                    <td className="px-4 py-2 text-right">
                      <PortalMenu
                        align="right"
                        trigger={
                          <button aria-label={`Actions for ${f.name}`} className="rounded p-1.5 text-text-muted hover:bg-[#e3e3e3] hover:text-text">
                            <MoreVertical size={14} />
                          </button>
                        }
                        items={[
                          { label: 'View details', onClick: () => setDetails(f) },
                          { label: 'Rename', onClick: () => openRename(f), disabled: !canEdit },
                          ...(canEdit
                            ? [{
                                label: 'Delete', destructive: true,
                                onClick: () =>
                                  confirm({
                                    title: `Delete ${f.name}?`,
                                    body: 'This cannot be undone.',
                                    confirmLabel: 'Delete',
                                    destructive: true,
                                    onConfirm: async () => {
                                      await deleteFiles([f.id])
                                      toast('File deleted', { tone: 'critical' })
                                    },
                                  }),
                              }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload file"
        size="sm"
        footer={
          <>
            <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!url.trim()}
              onClick={async () => {
                await addFileByUrl(url.trim())
                toast('File added')
                setUrl('')
                setUploadOpen(false)
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <Input
          label="File URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          helpText="Demo note: point at a local /images/… asset to avoid external dependencies."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {['/images/products/classic-cotton-t-shirt.svg', '/images/collections/home-goods.svg', '/images/banners/hero-banner-spring.svg'].map((src) => (
            <button key={src} onClick={() => setUrl(src)} className="text-xs text-accent hover:underline">
              {src.split('/').pop()}
            </button>
          ))}
        </div>
      </Modal>

      {/* Rename drawer */}
      <Drawer
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="Edit file"
        footer={
          <>
            <Button onClick={() => setRenaming(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!renaming) return
                await renameFile(renaming.id, renameValue)
                await setFileAlt(renaming.id, altValue)
                toast('File updated')
                setRenaming(null)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {renaming && (
          <div className="space-y-3">
            {renaming.type === 'image' && renaming.src && (
              <img src={renaming.src} alt="" className="max-h-44 rounded-lg border border-border object-cover" />
            )}
            <Input label="File name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            <Textarea label="Alt text" rows={2} value={altValue} onChange={(e) => setAltValue(e.target.value)} helpText="Describes the image for screen readers and SEO" />
          </div>
        )}
      </Drawer>

      {/* Details drawer */}
      <Drawer open={!!details} onClose={() => setDetails(null)} title={details?.name ?? ''}>
        {details && (
          <div className="space-y-3 text-[13px]">
            {details.type === 'image' && details.src && (
              <img src={details.src} alt="" className="rounded-lg border border-border" />
            )}
            <dl className="space-y-1.5">
              <div className="flex justify-between"><dt className="text-text-muted">Type</dt><dd><Badge tone="info">{details.type}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Size</dt><dd>{formatFileSize(details.sizeKb)}</dd></div>
              {details.dimensions && (
                <div className="flex justify-between"><dt className="text-text-muted">Dimensions</dt><dd>{details.dimensions.width} × {details.dimensions.height}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-text-muted">Uploaded</dt><dd>{formatDate(details.uploadedAt)}</dd></div>
              {details.alt && <div className="flex justify-between"><dt className="text-text-muted">Alt text</dt><dd className="max-w-[60%] text-right">{details.alt}</dd></div>}
            </dl>
            <Input label="Source" value={details.src || '—'} readOnly disabled />
          </div>
        )}
      </Drawer>

      {canEdit && (
        <Button
          className="fixed bottom-16 right-4 z-20 shadow-lg md:bottom-6"
          variant="primary"
          icon={<Plus size={14} />}
          onClick={() => setUploadOpen(true)}
        >
          Add
        </Button>
      )}
    </div>
  )
}
