import { useMemo, useState } from 'react'
import { Megaphone, Plus, Rocket, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { marketingTotals } from '@/lib/analytics'
import { formatMoney, formatNumber, formatPercent, formatRelative } from '@/lib/format'
import { CAMPAIGN_CHANNEL_LABELS, CAMPAIGN_STATUS_LABELS } from '@/lib/constants'
import {
  Badge, Button, Card, Drawer, EmptyState, Input, Modal, PageHeader, Select, useConfirm, useToast,
} from '@/components/ui'
import { completeCampaign, createCampaign, deleteCampaign, launchCampaign } from '@/services/marketingService'
import { useCan } from '@/lib/permissions'
import type { Campaign, CampaignChannel } from '@/types'

const channelIconBg: Record<CampaignChannel, string> = {
  email: 'bg-[#e0e7ff] text-[#4338ca]',
  social: 'bg-[#ffe4e6] text-[#be123c]',
  search: 'bg-[#e0f2fe] text-[#0369a1]',
  sms: 'bg-[#dcfce7] text-[#15803d]',
}

export default function MarketingPage() {
  const campaigns = useStore((s) => s.campaigns)
  const { toast } = useToast()
  const { confirm, confirmElement } = useConfirm()
  const [detail, setDetail] = useState<Campaign | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', channel: 'email' as CampaignChannel, audience: '5000', cost: '250' })
  const canEdit = useCan('products', 'edit')

  const totals = useMemo(() => marketingTotals(campaigns.filter((c) => c.status !== 'draft' && c.status !== 'scheduled')), [campaigns])
  const sorted = useMemo(() => [...campaigns].sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? '')), [campaigns])

  const submitCreate = async () => {
    if (!form.name.trim()) {
      toast('Give the campaign a name', { tone: 'critical' })
      return
    }
    await createCampaign({
      name: form.name.trim(),
      channel: form.channel,
      audience: Number(form.audience) || 0,
      cost: Number(form.cost) || 0,
    })
    toast('Campaign created as draft — launch it when ready')
    setCreateOpen(false)
    setForm({ name: '', channel: 'email', audience: '5000', cost: '250' })
  }

  return (
    <div>
      {confirmElement}
      <PageHeader
        title="Marketing"
        subtitle="Campaign performance across email, social, search and SMS"
        primaryAction={
          canEdit ? (
            <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)}>
              Create campaign
            </Button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: 'Reach', value: formatNumber(totals.reach) },
          { label: 'Sessions', value: formatNumber(totals.sessions) },
          { label: 'Orders attributed', value: formatNumber(totals.orders) },
          { label: 'Attributed revenue', value: formatMoney(totals.revenue) },
          { label: 'Conversion', value: formatPercent(totals.conversion, 2) },
          { label: 'ROAS', value: `${totals.roas.toFixed(1)}×` },
        ].map((k) => (
          <Card key={k.label} className="min-w-[130px] flex-1">
            <p className="text-xs text-text-muted">{k.label}</p>
            <p className="mt-1 text-lg font-semibold">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface">
          <EmptyState
            icon={Megaphone}
            heading="No campaigns yet"
            message="Create your first campaign to start tracking reach and attributed revenue."
            primaryAction={canEdit ? { label: 'Create campaign', onClick: () => setCreateOpen(true) } : undefined}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-[#fafafa] text-left text-xs text-text-muted">
                  <th className="px-4 py-2 font-medium">Campaign</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Audience</th>
                  <th className="px-4 py-2 text-right font-medium">Sessions</th>
                  <th className="px-4 py-2 text-right font-medium">Orders</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2 text-right font-medium">ROAS</th>
                  <th className="px-4 py-2 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((c) => {
                  const roas = c.cost ? c.revenue / c.cost : 0
                  return (
                    <tr key={c.id} className="cursor-pointer hover:bg-surface-hover" onClick={() => setDetail(c)}>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase ${channelIconBg[c.channel]}`}>
                            {CAMPAIGN_CHANNEL_LABELS[c.channel].slice(0, 2)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{c.name}</span>
                            <span className="block text-xs text-text-muted">
                              {CAMPAIGN_CHANNEL_LABELS[c.channel]} · {c.sentAt ? formatRelative(c.sentAt) : 'not sent'}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge tone={c.status === 'active' ? 'success' : c.status === 'scheduled' ? 'info' : c.status === 'draft' ? 'warning' : 'neutral'} dot>
                          {CAMPAIGN_STATUS_LABELS[c.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{formatNumber(c.audience)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(c.sessions)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(c.orders)}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatMoney(c.revenue)}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge tone={roas >= 3 ? 'success' : roas >= 1.5 ? 'warning' : 'critical'}>{roas.toFixed(1)}×</Badge>
                      </td>
                      <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        {canEdit && c.status === 'draft' && (
                          <Button size="sm" variant="primary" icon={<Rocket size={12} />} onClick={() => void launchCampaign(c.id).then(() => toast('Campaign launched'))}>
                            Launch
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail ? `${CAMPAIGN_CHANNEL_LABELS[detail.channel]} · ${CAMPAIGN_STATUS_LABELS[detail.status]}` : undefined}
        footer={
          <>
            {canEdit && detail && detail.status === 'draft' && (
              <Button variant="primary" icon={<Rocket size={13} />} onClick={() => void launchCampaign(detail.id).then(() => { toast('Campaign launched'); setDetail(null) })}>
                Launch now
              </Button>
            )}
            {canEdit && detail && detail.status === 'active' && (
              <Button onClick={() => void completeCampaign(detail.id).then(() => { toast('Campaign completed'); setDetail(null) })}>
                Mark complete
              </Button>
            )}
            {canEdit && detail && (
              <Button
                variant="destructive"
                icon={<Trash2 size={13} />}
                onClick={() =>
                  confirm({
                    title: `Delete ${detail.name}?`,
                    body: 'Its performance history will be removed from marketing reports.',
                    confirmLabel: 'Delete',
                    destructive: true,
                    onConfirm: async () => {
                      await deleteCampaign(detail.id)
                      toast('Campaign deleted', { tone: 'critical' })
                      setDetail(null)
                    },
                  })
                }
              >
                Delete
              </Button>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Audience', formatNumber(detail.audience)],
                ['Reached', formatNumber(detail.reached)],
                ['Sessions', formatNumber(detail.sessions)],
                ['Orders', formatNumber(detail.orders)],
                ['Revenue', formatMoney(detail.revenue)],
                ['Cost', formatMoney(detail.cost)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="mt-0.5 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-[#fafafa] p-3 text-[13px]">
              <p className="flex justify-between"><span className="text-text-muted">Conversion</span><span>{detail.sessions ? formatPercent((detail.orders / detail.sessions) * 100, 2) : '—'}</span></p>
              <p className="mt-1 flex justify-between"><span className="text-text-muted">Revenue per session</span><span>{detail.sessions ? formatMoney(detail.revenue / detail.sessions) : '—'}</span></p>
              <p className="mt-1 flex justify-between"><span className="text-text-muted">Cost per order</span><span>{detail.orders ? formatMoney(detail.cost / detail.orders) : '—'}</span></p>
            </div>
            <p className="text-xs text-text-muted">Activity</p>
            <ol className="space-y-2 text-[13px]">
              <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#8a8a8a]" />Campaign created</li>
              {detail.sentAt && (
                <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />Sent to {formatNumber(detail.audience)} recipients · {formatRelative(detail.sentAt)}</li>
              )}
              {detail.orders > 0 && (
                <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#196ec2]" />{formatNumber(detail.orders)} orders attributed so far</li>
              )}
            </ol>
          </div>
        )}
      </Drawer>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create campaign"
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => void submitCreate()}>Create draft</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Holiday Gift Guide" />
          <Select
            label="Channel"
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value as CampaignChannel })}
            options={Object.entries(CAMPAIGN_CHANNEL_LABELS).map(([value, label]) => ({ label, value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Audience size" type="number" min="0" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            <Input label="Estimated cost" type="number" step="0.01" min="0" prefix="$" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
