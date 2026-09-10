import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'

const baseControl =
  'w-full rounded-lg border border-[#c9c9c9] bg-surface px-2.5 text-[13px] text-text placeholder:text-text-subdued hover:border-border-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-[#fafafa] disabled:text-text-subdued'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | undefined
  label?: string
  helpText?: string
  prefix?: string
  connectedLeft?: React.ReactNode
  connectedRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, label, helpText, prefix, connectedLeft, connectedRight, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
  const control = (
    <span className="flex">
      {connectedLeft}
      <span className="relative flex-1">
        {prefix && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">{prefix}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${baseControl} h-8 ${prefix ? 'pl-5' : ''} ${
            connectedLeft ? 'rounded-l-none border-l-0' : ''
          } ${connectedRight ? 'rounded-r-none border-r-0' : ''} ${
            error ? 'border-critical-strong focus:border-critical-strong focus:ring-critical-strong' : ''
          } ${className}`}
          {...rest}
        />
      </span>
      {connectedRight}
    </span>
  )
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-text">
          {label}
        </label>
      )}
      {control}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 flex items-center gap-1 text-xs text-critical-strong">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {!error && helpText && (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-text-muted">
          {helpText}
        </p>
      )}
    </div>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | undefined
  label?: string
  helpText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, label, helpText, className = '', id, rows = 4, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error}
        className={`${baseControl} py-2 ${error ? 'border-critical-strong' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-critical-strong">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {!error && helpText && <p className="mt-1 text-xs text-text-muted">{helpText}</p>}
    </div>
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helpText?: string
  error?: string | undefined
  options?: { label: string; value: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helpText, error, options, className = '', id, children, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-text">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={`${baseControl} h-8 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23616161%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[position:right_8px_center] bg-no-repeat pr-7 ${
          error ? 'border-critical-strong' : ''
        } ${className}`}
        {...rest}
      >
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-critical-strong">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-text-muted">{helpText}</p>}
    </div>
  )
})

export function Checkbox({
  label,
  indeterminate,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; indeterminate?: boolean }) {
  return (
    <label className={`flex w-fit cursor-pointer items-center gap-2 text-[13px] ${className}`}>
      <input
        type="checkbox"
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate && !el.checked
        }}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#c9c9c9] accent-[#303030]"
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  )
}

export function Radio({
  label,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={`flex w-fit cursor-pointer items-center gap-2 text-[13px] ${className}`}>
      <input type="radio" className="h-4 w-4 shrink-0 cursor-pointer accent-[#303030]" {...rest} />
      {label && <span>{label}</span>}
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  helpText,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  helpText?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || helpText) && (
        <div>
          {label && <div className="text-[13px] font-medium text-text">{label}</div>}
          {helpText && <div className="mt-0.5 text-xs text-text-muted">{helpText}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
          checked ? 'bg-primary' : 'bg-[#c9c9c9]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
