export interface ValidationErrors {
  [field: string]: string | undefined
}

export const required =
  (message = 'This field is required') =>
  (value: unknown): string | undefined => {
    if (value === null || value === undefined) return message
    if (typeof value === 'string' && value.trim() === '') return message
    return undefined
  }

export const email =
  (message = 'Enter a valid email') =>
  (value: string): string | undefined => {
    if (!value) return undefined // let `required` handle empties
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : message
  }

export const positiveNumber =
  (message = 'Enter a number greater than 0') =>
  (value: number | string): string | undefined => {
    const n = Number(value)
    if (Number.isNaN(n) || n <= 0) return message
    return undefined
  }

export const nonNegativeNumber =
  (message = 'Enter 0 or more') =>
  (value: number | string): string | undefined => {
    const n = Number(value)
    if (Number.isNaN(n) || n < 0) return message
    return undefined
  }

export const maxDecimals =
  (decimals: number, message?: string) =>
  (value: number | string): string | undefined => {
    const s = String(value)
    if (s.includes('.') && s.split('.')[1]!.length > decimals)
      return message ?? `Max ${decimals} decimal place${decimals === 1 ? '' : 's'}`
    return undefined
  }

/** Run validators against a form object; returns {field: message} with only failures kept */
export function validate<T extends object>(
  values: T,
  rules: Partial<{ [K in keyof T]: ((v: T[K]) => string | undefined)[] }>,
): ValidationErrors {
  const errors: ValidationErrors = {}
  for (const key of Object.keys(rules) as (keyof T)[]) {
    for (const rule of rules[key] ?? []) {
      const err = rule(values[key])
      if (err) {
        errors[key as string] = err
        break
      }
    }
  }
  return errors
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean)
}

/** human slug from a title: "Summer Sale!" -> "summer-sale" */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
