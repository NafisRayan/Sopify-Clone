import re

p = 'src/features/settings/SettingsSectionPage.tsx'
s = open(p, encoding='utf-8').read()

# 1. reactive subscriptions in main component
old = """  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [rates, setRates] = useState<ShippingRate[]>(settings.shipping)"""
new = """  const markets = useStore((s2) => s2.markets)
  const locales = useStore((s2) => s2.locales)
  const planInfo = useStore((s2) => s2.plan[0]!)
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [rates, setRates] = useState<ShippingRate[]>(settings.shipping)"""
assert old in s, 'subscriptions anchor missing'
s = s.replace(old, new)

# 2. plan IIFE: drop getState line
old = "{(() => {\n                const planInfo = useStore.getState().plan[0]!\n                return ("
new = "{(() => {\n                return ("
assert old in s, 'plan IIFE anchor missing'
s = s.replace(old, new)

# 3. markets/locales lists use reactive vars
old = "{useStore.getState().markets.map((m) => (\n              <MarketRow key={m.code} market={m} />\n            ))}"
new = "{markets.map((m) => (\n              <MarketRow key={m.code} market={m} />\n            ))}"
assert old in s, 'markets anchor missing'
s = s.replace(old, new)

old = '{useStore.getState().locales.map((l) => (\n              <li key={l.code} className="flex items-center justify-between px-4 py-3">'
new = '{locales.map((l) => (\n              <li key={l.code} className="flex items-center justify-between px-4 py-3">'
assert old in s, 'locales anchor missing'
s = s.replace(old, new)

# 4. add the new imports after existing imports (only if missing)
if "formatRelative } from '@/lib/format'" not in s:
    anchor = "import type { ShippingRate } from '@/types'"
    s = s.replace(anchor, anchor)
    s = s.replace("import { PERMISSION_RESOURCES } from '@/types'",
"""import { PERMISSION_RESOURCES } from '@/types'
import { formatRelative } from '@/lib/format'
import { getStore } from '@/store/useStore'
import { uid } from '@/lib/id'
import { delay } from '@/lib/delay'
import type { MetafieldDefinition, MetafieldType, MarketCountry, StoreLocale } from '@/types/parity'""")

components = '''
// ── Markets row ────────────────────────────────────────────────────────────
function MarketRow({ market }: { market: MarketCountry }) {
  const { toast } = useToast()
  const canEdit = useCan('settings', 'edit')
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-[13px] font-medium">
          {market.name} <span className="text-text-muted">({market.code})</span>
        </p>
        <p className="text-xs text-text-muted">Prices shown in {market.currency}</p>
      </div>
      <div className="flex items-center gap-3">
        {draft !== null ? (
          <>
            <Input type="number" min="0" max="100" value={draft} onChange={(e) => setDraft(e.target.value)} className="w-24" aria-label="Price adjustment" />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const store = getStore()
                store.updateMarkets(
                  store.markets.map((m) => (m.code === market.code ? { ...m, priceAdjustmentPercent: Number(draft) || 0 } : m)),
                )
                setDraft(null)
                toast('Market updated')
              }}
            >
              Save
            </Button>
          </>
        ) : (
          <button className="text-[13px] text-accent hover:underline" onClick={() => canEdit && setDraft(String(market.priceAdjustmentPercent))}>
            {market.priceAdjustmentPercent > 0 ? `+${market.priceAdjustmentPercent}% price adjustment` : 'No price adjustment'}
          </button>
        )}
        <Toggle
          label={market.enabled ? 'Active' : 'Inactive'}
          checked={market.enabled}
          onChange={(v) => {
            const store = getStore()
            store.updateMarkets(store.markets.map((m) => (m.code === market.code ? { ...m, enabled: v } : m)))
            toast(`Market ${v ? 'activated' : 'deactivated'}`)
          }}
          disabled={!canEdit}
        />
      </div>
    </li>
  )
}

// ── Add locale ─────────────────────────────────────────────────────────────
const LOCALE_POOL: StoreLocale[] = [
  { code: 'es', name: 'Spanish', isDefault: false, published: false },
  { code: 'it', name: 'Italian', isDefault: false, published: false },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', isDefault: false, published: false },
  { code: 'ja', name: 'Japanese', isDefault: false, published: false },
  { code: 'nl', name: 'Dutch', isDefault: false, published: false },
]

function AddLocaleButton() {
  const locales = useStore((s2) => s2.locales)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const available = LOCALE_POOL.filter((l) => !locales.some((x) => x.code === l.code))
  return (
    <>
      <Button size="sm" variant="primary" onClick={() => setOpen(true)} disabled={available.length === 0}>
        Add language
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add language"
        size="sm"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!choice}
              onClick={() => {
                const locale = available.find((l) => l.code === choice)
                if (!locale) return
                const store = getStore()
                store.updateLocales([...store.locales, { ...locale, published: true }])
                toast(`${locale.name} added and published`)
                setOpen(false)
                setChoice('')
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <Select
          label="Language"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          options={[{ label: 'Choose a language…', value: '' }, ...available.map((l) => ({ label: l.name, value: l.code }))]}
        />
      </Modal>
    </>
  )
}

// ── Activity log ───────────────────────────────────────────────────────────
function ActivityLog() {
  const activity = useStore((s2) => s2.staffActivity)
  const staff = useStore((s2) => s2.staff)
  const [staffFilter, setStaffFilter] = useState('')
  const filtered = staffFilter ? activity.filter((a) => a.staffId === staffFilter) : activity
  return (
    <Card padding={false}>
      <CardHeader
        title="Staff activity"
        subtitle="Actions taken in this admin, newest first"
        actions={
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            aria-label="Filter by staff member"
            className="h-8 cursor-pointer rounded-lg border border-[#c9c9c9] bg-surface px-2 text-[13px]"
          >
            <option value="">All staff</option>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        }
      />
      <ul className="divide-y divide-border">
        {filtered.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
            <span className="min-w-0">
              <span className="block truncate font-medium">{a.action}</span>
              <span className="block truncate text-xs text-text-muted">
                {a.staffName} · {a.resource}
                {a.resourceId ? ` · ${a.resourceId}` : ''}
              </span>
            </span>
            <span className="shrink-0 text-xs text-text-muted">{formatRelative(a.at)}</span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-[13px] text-text-muted">No activity recorded for this staff member.</li>
        )}
      </ul>
    </Card>
  )
}

// ── Metafield definitions editor ───────────────────────────────────────────
const MF_TYPES: MetafieldType[] = ['single_line_text', 'multi_line_text', 'integer', 'decimal', 'boolean', 'date', 'url']
const MF_RESOURCE_LABEL: Record<MetafieldDefinition['resourceType'], string> = {
  product: 'Products', customer: 'Customers', order: 'Orders', company: 'Companies',
}

function MetafieldDefinitionsEditor() {
  const definitions = useStore((s2) => s2.metafieldDefinitions)
  const { toast } = useToast()
  const canEdit = useCan('settings', 'edit')
  const [form, setForm] = useState({ name: '', namespace: 'custom', key: '', type: 'single_line_text' as MetafieldType, resourceType: 'product' as MetafieldDefinition['resourceType'] })
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Card padding={false}>
        <CardHeader
          title="Metafield definitions"
          subtitle="Structured fields for products, customers, orders and companies"
          actions={
            canEdit && (
              <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
                Add definition
              </Button>
            )
          }
        />
        <ul className="divide-y divide-border">
          {definitions.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">
                  {d.name} <span className="font-mono text-xs text-text-muted">{d.namespace}.{d.key}</span>
                </span>
                <span className="block text-xs text-text-muted">
                  {MF_RESOURCE_LABEL[d.resourceType]} · {d.type}
                  {d.description ? ` · ${d.description}` : ''}
                </span>
              </span>
              {canEdit && (
                <Button
                  size="sm"
                  variant="tertiary"
                  onClick={() => {
                    const store = getStore()
                    store.removeMetafieldDefinition(d.id)
                    toast('Definition removed')
                  }}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
          {definitions.length === 0 && (
            <li className="px-4 py-8 text-center text-[13px] text-text-muted">No definitions yet.</li>
          )}
        </ul>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add metafield definition"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!form.name.trim() || !form.key.trim()) {
                  toast('Name and key are required', { tone: 'critical' })
                  return
                }
                await delay(250)
                const store = getStore()
                store.upsertMetafieldDefinition({
                  id: uid('mfdef'),
                  namespace: form.namespace.trim() || 'custom',
                  key: form.key.trim().toLowerCase().replace(/\\s+/g, '_'),
                  name: form.name.trim(),
                  type: form.type,
                  resourceType: form.resourceType,
                })
                toast('Definition added')
                setOpen(false)
                setForm({ name: '', namespace: 'custom', key: '', type: 'single_line_text', resourceType: 'product' })
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Care instructions" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Namespace" value={form.namespace} onChange={(e) => setForm({ ...form, namespace: e.target.value })} />
            <Input label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="care_instructions" />
          </div>
          <Select
            label="Content type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as MetafieldType })}
            options={MF_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))}
          />
          <Select
            label="Applies to"
            value={form.resourceType}
            onChange={(e) => setForm({ ...form, resourceType: e.target.value as MetafieldDefinition['resourceType'] })}
            options={Object.entries(MF_RESOURCE_LABEL).map(([value, label]) => ({ label, value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
'''

if 'function MarketRow' not in s:
    s = s.rstrip() + '\n' + components

open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('SettingsSectionPage updated')
