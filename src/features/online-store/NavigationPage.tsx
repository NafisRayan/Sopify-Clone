import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, CornerDownRight, Link2, Plus, Trash2, Undo2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Button, Card, CardHeader, EmptyState, Input, PageHeader, useToast } from '@/components/ui'
import { updateMenu } from '@/services/contentService'
import { uid } from '@/lib/id'
import { useCan } from '@/lib/permissions'
import type { MenuItem, NavMenu } from '@/types'

function newLink(): MenuItem {
  return { id: uid('mi'), title: 'New link', url: '/collections/all', children: [] }
}

function move(list: MenuItem[], index: number, dir: -1 | 1): MenuItem[] {
  const next = [...list]
  const j = index + dir
  if (j < 0 || j >= next.length) return list
  ;[next[index], next[j]] = [next[j]!, next[index]!]
  return next
}

/** Nest item at index under its previous sibling */
function nestUnderPrevious(list: MenuItem[], index: number): MenuItem[] {
  if (index === 0) return list
  const next = list.map((x) => ({ ...x, children: [...x.children] }))
  const [item] = next.splice(index, 1)
  const target = next[index - 1]
  if (target && item) target.children.push(item)
  return next
}

function countLinks(items: MenuItem[]): number {
  return items.reduce((s, i) => s + 1 + countLinks(i.children), 0)
}

interface LevelProps {
  items: MenuItem[]
  depth: number
  canEdit: boolean
  /** transform the list at THIS level */
  onMutate: (transform: (list: MenuItem[]) => MenuItem[]) => void
  /** promote a nested item up one level */
  onPromoteToParent: (item: MenuItem) => void
}

function MenuLevel({ items, depth, canEdit, onMutate, onPromoteToParent }: LevelProps) {
  return (
    <ul className={depth > 0 ? 'ml-6 border-l border-border pl-3' : ''}>
      {items.map((item, i) => (
        <li key={item.id} className="py-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {depth > 0 && <CornerDownRight size={12} className="shrink-0 text-text-subdued" />}
            <Input
              value={item.title}
              onChange={(e) => onMutate((list) => list.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)))}
              disabled={!canEdit}
              className="max-w-[200px]"
              aria-label="Link title"
            />
            <Input
              value={item.url}
              onChange={(e) => onMutate((list) => list.map((x) => (x.id === item.id ? { ...x, url: e.target.value } : x)))}
              disabled={!canEdit}
              className="max-w-[240px]"
              aria-label="Link URL"
            />
            {canEdit && (
              <span className="flex items-center gap-0.5">
                <button aria-label="Move up" disabled={i === 0} onClick={() => onMutate((list) => move(list, i, -1))} className="rounded p-1.5 text-text-muted hover:bg-surface-hover hover:text-text disabled:opacity-30">
                  <ArrowUp size={13} />
                </button>
                <button aria-label="Move down" disabled={i === items.length - 1} onClick={() => onMutate((list) => move(list, i, 1))} className="rounded p-1.5 text-text-muted hover:bg-surface-hover hover:text-text disabled:opacity-30">
                  <ArrowDown size={13} />
                </button>
                <button aria-label="Nest under previous item" disabled={i === 0} onClick={() => onMutate((list) => nestUnderPrevious(list, i))} className="rounded p-1.5 text-text-muted hover:bg-surface-hover hover:text-text disabled:opacity-30">
                  <CornerDownRight size={13} />
                </button>
                {depth > 0 && (
                  <button
                    aria-label={`Promote ${item.title} up a level`}
                    onClick={() => onPromoteToParent(item)}
                    className="rounded p-1.5 text-text-muted hover:bg-surface-hover hover:text-text"
                  >
                    <Undo2 size={13} />
                  </button>
                )}
                <button
                  aria-label={`Remove ${item.title}`}
                  onClick={() => onMutate((list) => list.filter((x) => x.id !== item.id))}
                  className="rounded p-1.5 text-text-muted hover:bg-critical-surface hover:text-critical-strong"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            )}
          </div>
          {item.children.length > 0 && (
            <MenuLevel
              items={item.children}
              depth={depth + 1}
              canEdit={canEdit}
              onMutate={(transform) =>
                onMutate((list) => list.map((x) => (x.id === item.id ? { ...x, children: transform(x.children) } : x)))
              }
              onPromoteToParent={(child) =>
                onMutate((list) => {
                  const withoutChild = list.map((x) =>
                    x.id === item.id ? { ...x, children: x.children.filter((c) => c.id !== child.id) } : x,
                  )
                  const idx = withoutChild.findIndex((x) => x.id === item.id)
                  const next = [...withoutChild]
                  next.splice(idx + 1, 0, child)
                  return next
                })
              }
            />
          )}
          {canEdit && item.children.length === 0 && depth < 1 && (
            <button
              className="mt-1 flex items-center gap-1 text-xs text-accent hover:underline"
              onClick={() =>
                onMutate((list) =>
                  list.map((x) => (x.id === item.id ? { ...x, children: [...x.children, newLink()] } : x)),
                )
              }
            >
              <Plus size={11} /> Add sub-link
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function NavigationPage() {
  const { handle } = useParams()
  const navigate = useNavigate()
  const menus = useStore((s) => s.menus)
  const { toast } = useToast()
  const [draft, setDraft] = useState<{ handle: NavMenu['handle']; items: MenuItem[] } | null>(null)
  const [saving, setSaving] = useState(false)
  const canEdit = useCan('products', 'edit')

  const activeHandle: NavMenu['handle'] = handle === 'footer' ? 'footer' : 'main-menu'
  const menu = useMemo(() => {
    const base = menus.find((m) => m.handle === activeHandle)
    if (!base) return undefined
    return draft && draft.handle === activeHandle ? { ...base, items: draft.items } : base
  }, [menus, activeHandle, draft])

  const otherMenus = menus.filter((m) => m.handle !== activeHandle)

  if (!menu) {
    return (
      <div>
        <PageHeader title="Navigation" backTo="/online-store" backLabel="Online Store" />
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            heading="Menu not found"
            primaryAction={{ label: 'Back', onClick: () => navigate('/online-store') }}
          />
        </div>
      </div>
    )
  }

  const mutate = (transform: (list: MenuItem[]) => MenuItem[]) =>
    setDraft({ handle: activeHandle, items: transform(menu.items) })

  const save = async () => {
    setSaving(true)
    try {
      await updateMenu(activeHandle, menu.items)
      setDraft(null)
      toast('Menu saved — refresh the page to verify persistence')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Navigation"
        subtitle="Menus power your storefront header and footer links"
        backTo="/online-store"
        backLabel="Online Store"
        primaryAction={
          canEdit && (
            <Button variant="primary" loading={saving} onClick={() => void save()} disabled={!draft}>
              Save menu
            </Button>
          )
        }
        secondaryActions={
          draft ? (
            <Button icon={<Undo2 size={13} />} onClick={() => setDraft(null)}>
              Discard changes
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-1" role="tablist">
        {menus.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={m.handle === activeHandle}
            className={`h-8 rounded-lg px-3 text-[13px] font-medium ${m.handle === activeHandle ? 'bg-[#e3e3e3] text-text' : 'text-text-muted hover:bg-surface-hover'}`}
            onClick={() => {
              setDraft(null)
              navigate(`/online-store/navigation/${m.handle}`)
            }}
          >
            {m.title}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader
              title={menu.title}
              subtitle={`${countLinks(menu.items)} links · saved to this demo store`}
              actions={
                canEdit && (
                  <Button size="sm" icon={<Plus size={12} />} onClick={() => mutate((list) => [...list, newLink()])}>
                    Add link
                  </Button>
                )
              }
            />
            <div className="px-4 py-4">
              {menu.items.length === 0 ? (
                <EmptyState
                  compact
                  icon={Link2}
                  heading="No links yet"
                  message="Add links to collections, pages, or products."
                  primaryAction={canEdit ? { label: 'Add link', onClick: () => mutate((list) => [...list, newLink()]) } : undefined}
                />
              ) : (
                <MenuLevel items={menu.items} depth={0} canEdit={canEdit} onMutate={mutate} onPromoteToParent={() => {}} />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-[13px] font-semibold">Other menus</h3>
            <ul className="mt-2 space-y-1.5">
              {otherMenus.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/online-store/navigation/${m.handle}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[13px] hover:bg-surface-hover"
                  >
                    <span>{m.title}</span>
                    <span className="text-xs text-text-muted">{countLinks(m.items)} links</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-[13px] font-semibold">Tips</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-text-muted">
              <li>The corner-down arrow nests a link under the one above it.</li>
              <li>Nested links show the promote arrow to move them back up a level.</li>
              <li>Two levels are supported, like the storefront header.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
