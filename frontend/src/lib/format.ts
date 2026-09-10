const CURRENCY = 'USD'

export function formatMoney(amount: number, opts?: { compact?: boolean; signed?: boolean }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY,
    notation: opts?.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts?.compact ? 1 : 2,
    minimumFractionDigits: opts?.compact ? 0 : 2,
    signDisplay: opts?.signed ? 'exceptZero' : 'auto',
  }).format(amount)
}

export function formatNumber(n: number, opts?: { compact?: boolean }): string {
  return new Intl.NumberFormat('en-US', {
    notation: opts?.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts?.compact ? 1 : 0,
  }).format(n)
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "3 h ago", "2 d ago", falls back to date for older items */
export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function formatWeight(grams: number | undefined, unit: 'kg' | 'lb' = 'kg'): string {
  if (grams === undefined) return '—'
  if (unit === 'kg') return `${(grams / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} kg`
  return `${(grams / 453.592).toLocaleString('en-US', { maximumFractionDigits: 2 })} lb`
}

export function formatFileSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatAddress(a: {
  address1: string
  address2?: string
  city: string
  province: string
  zip: string
  country: string
}): string {
  return [a.address1, a.address2, `${a.city}, ${a.province} ${a.zip}`, a.country]
    .filter(Boolean)
    .join(', ')
}
