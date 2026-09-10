let counter = 0

/** Simple collision-safe id: prefix + time base36 + counter + random */
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1296
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(2, '0')}${Math.floor(
    Math.random() * 1296,
  )
    .toString(36)
    .padStart(2, '0')}`
}
