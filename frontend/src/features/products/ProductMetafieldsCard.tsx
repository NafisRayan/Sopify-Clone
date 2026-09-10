import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Button, Card, CardHeader, Input, Textarea, useToast } from '@/components/ui'
import { ownerKey, setMetafields } from '@/services/metafieldService'
import type { Metafield, MetafieldType } from '@/types/parity'

/** Product metafields editor (Admin API parity: metafieldsSet) */
export function ProductMetafieldsCard({ productId }: { productId: string }) {
  const definitions = useStore((s) => s.metafieldDefinitions.filter((d) => d.resourceType === 'product'))
  const metafieldsMap = useStore((s) => s.metafields)
  const { toast } = useToast()
  const key = ownerKey('product', productId)
  const stored = metafieldsMap[key] ?? []
  const [draft, setDraft] = useState<Metafield[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(structuredClone(stored))
  }, [metafieldsMap, key])

  const valueOf = (definitionId: string) => draft.find((m) => m.definitionId === definitionId)?.value ?? ''

  const setValue = (definitionId: string, value: string) => {
    setDraft((prev) => {
      const existing = prev.find((m) => m.definitionId === definitionId)
      if (existing) return prev.map((m) => (m.definitionId === definitionId ? { ...m, value } : m))
      return [...prev, { id: `mf_${definitionId}_${Math.random().toString(36).slice(2, 8)}`, definitionId, value }]
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      await setMetafields(key, draft.filter((m) => m.value !== ''))
      toast('Metafields saved')
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(draft.filter((m) => m.value !== '')) !== JSON.stringify(stored)

  if (definitions.length === 0) {
    return (
      <Card>
        <h3 className="text-[13px] font-semibold">Metafields</h3>
        <p className="mt-1.5 text-[13px] text-text-muted">
          No product metafield definitions yet — add them in Settings → Metafields.
        </p>
      </Card>
    )
  }

  return (
    <Card padding={false}>
      <CardHeader
        title="Metafields"
        subtitle="Structured extra data for this product"
        actions={
          dirty && (
            <Button size="sm" variant="primary" loading={saving} onClick={() => void save()}>
              Save
            </Button>
          )
        }
      />
      <div className="space-y-3 px-4 py-3.5">
        {definitions.map((d) => {
          const value = valueOf(d.id)
          const inputId = `mf-${d.id}`
          return (
            <div key={d.id}>
              {d.type === 'multi_line_text' ? (
                <Textarea
                  label={fieldLabel(d.name)}
                  id={inputId}
                  rows={2}
                  value={value}
                  onChange={(e) => setValue(d.id, e.target.value)}
                />
              ) : (
                <Input
                  label={fieldLabel(d.name)}
                  id={inputId}
                  type={inputType(d.type)}
                  value={value}
                  onChange={(e) => setValue(d.id, e.target.value)}
                />
              )}
            </div>
          )
        })}
        <p className="text-xs text-text-muted">Empty values are removed on save.</p>
      </div>
    </Card>
  )
}

function fieldLabel(name: string): string {
  return name
}

function inputType(type: MetafieldType): string {
  switch (type) {
    case 'integer': return 'number'
    case 'decimal': return 'number'
    case 'date': return 'date'
    case 'url': return 'url'
    default: return 'text'
  }
}
