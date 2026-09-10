import { useMemo, useState } from 'react'
import { MapPin, Pencil, Phone, Plus, Store } from 'lucide-react'
import { useStore } from '@/store/useStore'
import {
  Badge, Button, Card, Drawer, EmptyState, Input, PageHeader, Toggle, useConfirm, useToast,
} from '@/components/ui'
import { formatDate } from '@/lib/format'
import { useInventoryActions, type LocationInput } from './useInventoryActions'
import { useCan } from '@/lib/permissions'
import type { Location } from '@/types'

const emptyForm: LocationInput = {
  name: '',
  address1: '',
  city: '',
  province: '',
  country: 'United States',
  zip: '',
  phone: '',
}

export default function LocationsPage() {
  const locations = useStore((s) => s.locations)
  const inventoryLevels = useStore((s) => s.inventoryLevels)
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const { createLocation, updateLocation, setLocationActive } = useInventoryActions()
  const [editor, setEditor] = useState<{ mode: 'create' } | { mode: 'edit'; location: Location } | null>(null)
  const [form, setForm] = useState<LocationInput>(emptyForm)
  const canEdit = useCan('products', 'edit')

  const unitsAt = useMemo(() => {
    const map = new Map<string, { onHand: number; variants: number }>()
    for (const l of inventoryLevels) {
      const entry = map.get(l.locationId) ?? { onHand: 0, variants: 0 }
      entry.onHand += l.available + l.committed + l.unavailable
      entry.variants += 1
      map.set(l.locationId, entry)
    }
    return map
  }, [inventoryLevels])

  const openCreate = () => {
    setForm(emptyForm)
    setEditor({ mode: 'create' })
  }
  const openEdit = (loc: Location) => {
    setForm({
      name: loc.name,
      address1: loc.address1,
      city: loc.city,
      province: loc.province,
      country: loc.country,
      zip: loc.zip,
      phone: loc.phone ?? '',
    })
    setEditor({ mode: 'edit', location: loc })
  }

  const save = async () => {
    if (!form.name.trim() || !form.address1.trim()) {
      toast('Name and street address are required', { tone: 'critical' })
      return
    }
    if (editor?.mode === 'edit') {
      await updateLocation(editor.location.id, form)
      toast('Location updated')
    } else {
      await createLocation(form)
      toast('Location created')
    }
    setEditor(null)
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="Locations"
        subtitle="Places where inventory is stocked and orders are fulfilled"
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<Plus size={13} />} onClick={openCreate}>
              Add location
            </Button>
          ) : undefined
        }
      />

      {locations.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Store}
            heading="No locations yet"
            message="Add a warehouse or retail location to start tracking inventory."
            primaryAction={canEdit ? { label: 'Add location', onClick: openCreate } : undefined}
          />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {locations.map((loc) => {
            const stats = unitsAt.get(loc.id)
            return (
              <Card key={loc.id} padding={false}>
                <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Store size={15} className="shrink-0 text-text-muted" />
                      <h3 className="truncate text-[14px] font-semibold">{loc.name}</h3>
                      <Badge tone={loc.active ? 'success' : 'neutral'} dot>{loc.active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-text-muted">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      {loc.address1}, {loc.city} {loc.province} {loc.zip}, {loc.country}
                    </p>
                    {loc.phone && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-text-muted">
                        <Phone size={13} /> {loc.phone}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-text-subdued">
                      Added {formatDate(loc.createdAt)} · {stats?.variants ?? 0} SKUs · {stats?.onHand ?? 0} units on hand
                    </p>
                  </div>
                  {canEdit && (
                    <Button size="sm" icon={<Pencil size={12} />} onClick={() => openEdit(loc)}>
                      Edit
                    </Button>
                  )}
                </div>
                {canEdit && (
                  <div className="border-t border-border px-4 py-2.5">
                    <Toggle
                      label="Active"
                      helpText={loc.active ? 'Receives inventory and fulfills orders' : 'Hidden from fulfillment'}
                      checked={loc.active}
                      onChange={(on) => {
                        if (!on) {
                          confirm({
                            title: `Deactivate ${loc.name}?`,
                            body: stats?.onHand
                              ? `This location still holds ${stats.onHand} units. Deactivating hides it from fulfillment until stock is moved.`
                              : 'The location will be hidden from fulfillment flows.',
                            confirmLabel: 'Deactivate',
                            destructive: true,
                            onConfirm: async () => {
                              await setLocationActive(loc.id, false)
                              toast('Location deactivated')
                            },
                          })
                        } else {
                          void setLocationActive(loc.id, true).then(() => toast('Location activated'))
                        }
                      }}
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit drawer */}
      <Drawer
        open={!!editor}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'edit' ? 'Edit location' : 'Add location'}
        footer={
          <>
            <Button onClick={() => setEditor(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Portland Warehouse" />
          <Input label="Street address" value={form.address1} onChange={(e) => setForm({ ...form, address1: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State / Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="ZIP / Postal code" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </Drawer>
    </div>
  )
}
