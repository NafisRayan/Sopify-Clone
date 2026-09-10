/**
 * Deterministic PRNG (mulberry32) so generated seed data is stable across runs.
 * Also usable in the browser for id generation (non-seeded mode).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number
  constructor(seed = 42) {
    this.next = mulberry32(seed)
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
  float(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min
    const f = 10 ** decimals
    return Math.round(v * f) / f
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!
  }
  /** Weighted pick: [[value, weight], ...] */
  weighted<T>(pairs: readonly [T, number][]): T {
    const total = pairs.reduce((s, [, w]) => s + w, 0)
    let r = this.next() * total
    for (const [value, w] of pairs) {
      r -= w
      if (r <= 0) return value
    }
    return pairs[pairs.length - 1]![0]
  }
  bool(pTrue = 0.5): boolean {
    return this.next() < pTrue
  }
  chance(p: number): boolean {
    return this.next() < p
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[a[i], a[j]] = [a[j]!, a[i]!]
    }
    return a
  }
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle([...arr]).slice(0, n)
  }
  /** Random date within the last `days` days, biased toward recent if skew=true */
  dateWithin(days: number, skew = false): Date {
    const now = Date.now()
    const window = days * 24 * 3600 * 1000
    const offset = skew ? this.next() ** 1.6 * window : this.next() * window
    return new Date(now - offset)
  }
  dateBetween(from: Date, to: Date): Date {
    return new Date(from.getTime() + this.next() * (to.getTime() - from.getTime()))
  }
}
