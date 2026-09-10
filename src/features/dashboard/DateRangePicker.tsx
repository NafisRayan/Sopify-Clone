import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarIcon, Check, ChevronDown } from 'lucide-react'
import { Button, Popover, Input } from '@/components/ui'
import { DATE_PRESETS, presetRange, type PresetKey } from '@/lib/analytics'
import type { DateRange } from '@/lib/analytics'

/** Date-range selector with presets + custom window (spec §9). Synced to URL. */
export function DateRangePicker({ range }: { range: DateRange }) {
  const [params, setParams] = useSearchParams()
  const presetKey = (params.get('range') ?? 'last30') as PresetKey
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  const setPreset = (key: PresetKey) => {
    const next = new URLSearchParams(params)
    if (key === 'custom') {
      next.set('range', 'custom')
      if (customFrom) next.set('from', customFrom)
      if (customTo) next.set('to', customTo)
    } else {
      next.set('range', key)
      next.delete('from')
      next.delete('to')
    }
    setParams(next, { replace: true })
  }

  return (
    <Popover
      align="right"
      panelClassName="w-64"
      trigger={
        <Button size="sm" icon={<CalendarIcon size={13} />}>
          {range.label}
          <ChevronDown size={12} />
        </Button>
      }
    >
      {(close) => (
        <div>
          <ul className="space-y-0.5">
            {DATE_PRESETS.filter((p) => p.key !== 'custom').map((p) => (
              <li key={p.key}>
                <button
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface-hover ${
                    presetKey === p.key ? 'font-medium text-text' : 'text-text-muted'
                  }`}
                  onClick={() => {
                    setPreset(p.key)
                    close()
                  }}
                >
                  {p.label}
                  {presetKey === p.key && <Check size={13} className="text-accent" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-border pt-2">
            <p className="mb-1.5 text-xs font-semibold text-text">Custom range</p>
            <div className="space-y-2">
              <Input type="date" label="From" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <Input type="date" label="To" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              <Button
                size="sm"
                variant="primary"
                className="w-full"
                onClick={() => {
                  if (customFrom && customTo) {
                    setPreset('custom')
                    close()
                  }
                }}
                disabled={!customFrom || !customTo}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </Popover>
  )
}

export function useDashboardRange(): DateRange {
  const [params] = useSearchParams()
  const presetKey = (params.get('range') ?? 'last30') as PresetKey
  return presetRange(presetKey, { from: params.get('from') ?? '', to: params.get('to') ?? '' })
}
