import { Prisma } from '@prisma/client'
/** Shared GraphQL payload helpers (Shopify userErrors pattern) */

export interface UserError {
  field: string[]
  message: string
}

export function userError(field: string, message: string): UserError {
  return { field: [field], message }
}

/** Offset-free cursor encoding (opaque, Shopify-style) */
export function encodeCursor(index: number): string {
  return Buffer.from(`cursor:${index}`).toString('base64')
}

export function decodeCursor(cursor: string | undefined | null): number {
  if (!cursor) return -1
  const raw = Buffer.from(cursor, 'base64').toString('utf8')
  const n = Number(raw.replace('cursor:', ''))
  return Number.isFinite(n) ? n : -1
}

export interface Connection<T> {
  edges: { cursor: string; node: T }[]
  pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean }
  totalCount: number
}

export function toConnection<T>(rows: T[], first: number, after?: string | null): Connection<T> {
  const start = decodeCursor(after) + 1
  const slice = rows.slice(start, start + first)
  return {
    edges: slice.map((node, i) => ({ cursor: encodeCursor(start + i), node })),
    pageInfo: {
      hasNextPage: start + first < rows.length,
      hasPreviousPage: start > 0,
    },
    totalCount: rows.length,
  }
}

/** Case-insensitive contains across a set of string fields (Shopify `query:` param) */
export function filterByQuery<T>(rows: T[], query: string | undefined, fields: (row: T) => (string | undefined)[]): T[] {
  if (!query?.trim()) return rows
  const tokens = query.trim().toLowerCase().split(/\s+/)
  return rows.filter((row) =>
    tokens.every((token) => fields(row).some((f) => f?.toLowerCase().includes(token))),
  )
}

/** JSON column helpers — Postgres native JSON (values arrive as objects) */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') return value as unknown as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toJson(value: unknown): any {
  if (value === null || value === undefined) return Prisma.DbNull
  return value
}
