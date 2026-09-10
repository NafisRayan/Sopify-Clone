/** Shared small utilities */

let counter = 0

/** Collision-safe id: prefix + time base36 + counter + random */
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1296
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(2, '0')}${Math.floor(
    Math.random() * 1296,
  )
    .toString(36)
    .padStart(2, '0')}`
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}
