import { useStore } from '@/store/useStore'

/**
 * GraphQL bridge to the NestJS backend (backend/).
 *
 * Mode selection:
 *  - VITE_API_URL set  → REMOTE: every UI mutation optimistically updates the
 *    local store, fires the matching GraphQL mutation, then reconciles with a
 *    debounced `bootstrap` refetch (server is source of truth).
 *  - VITE_API_URL unset → LOCAL demo: localStorage persistence only.
 */

export const API_URL: string | undefined = (import.meta as any).env?.VITE_API_URL || undefined
export const IS_REMOTE = Boolean(API_URL)

export async function gqlRequest<T = any>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!API_URL) throw new Error('API_URL not configured')
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

/** GraphQL literal for inline values (JSON-compatible with GraphQL input literals) */
export const q = (v: unknown): string => JSON.stringify(v ?? null)

/** Fire an inline mutation against the backend (remote mode only); reconciles after. */
export function syncMutation(mutation: string): void {
  if (!IS_REMOTE) return
  const field = mutation.replace(/^mutation\s*/, '').trim().replace(/^{(.*)}$/s, '$1').trim()
  gqlRequest(`mutation _ { ${field} }`)
    .then(() => scheduleRefresh())
    .catch((e) => console.error('[sync]', mutation.slice(0, 60), e))
}

// ─── Server reconcile ───────────────────────────────────────────────────────

const SNAPSHOT_QUERY = `{
  bootstrap {
    products customers orders abandonedCheckouts collections locations inventoryLevels
    inventoryHistory discounts campaigns staff pages blogPosts files menus apps
    notifications tasks theme themeLibrary companies segments transfers giftCards
    payouts balanceTransactions metafieldDefinitions metafields redirects locales
    markets activity returns orderEdits plan
    settings { value }
  }
}`

let refreshTimer: ReturnType<typeof setTimeout> | null = null
let refreshing = false

/** Debounced full reconcile from the server (server is source of truth). */
export function scheduleRefresh(delayMs = 600): void {
  if (!IS_REMOTE) return
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => void refreshFromServer(), delayMs)
}

export async function refreshFromServer(): Promise<void> {
  if (!IS_REMOTE || refreshing) return
  refreshing = true
  try {
    const data = await gqlRequest<any>(SNAPSHOT_QUERY)
    if (data?.bootstrap) {
      useStore.getState().hydrateRemote(data.bootstrap)
    }
  } catch (e) {
    console.error('[api] bootstrap refresh failed', e)
  } finally {
    refreshing = false
  }
}
