import { useCallback, useEffect, useRef, useState } from 'react'

/** Wraps a service mutation with loading + error state (spec §43/§54/§55) */
export function useMutation<TArgs extends unknown[], R>(
  fn: (...args: TArgs) => Promise<R>,
): {
  mutate: (...args: TArgs) => Promise<R | undefined>
  loading: boolean
  error: string | null
  clearError: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  useEffect(() => () => {
    mounted.current = false
  }, [])

  const mutate = useCallback(
    async (...args: TArgs) => {
      setLoading(true)
      setError(null)
      try {
        return await fn(...args)
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : 'Something went wrong')
        return undefined
      } finally {
        if (mounted.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  )

  return { mutate, loading, error, clearError: () => setError(null) }
}

export function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function useEscape(handler: () => void, active = true): void {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handler, active])
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = () => setMatches(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export const useIsMobile = (): boolean => useMediaQuery('(max-width: 767px)')
