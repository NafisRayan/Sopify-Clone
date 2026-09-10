import { useState } from 'react'
import { X } from 'lucide-react'

/** Comma/Enter-driven tag editor used across features */
export function TagInput({
  value,
  onChange,
  placeholder = 'Add tag',
  suggestions,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
}) {
  const [draft, setDraft] = useState('')

  const add = (tag: string) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }

  return (
    <div className="rounded-lg border border-[#c9c9c9] bg-surface px-2 py-1.5 hover:border-border-strong focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-[#e3e3e3] px-1.5 py-0.5 text-xs text-text"
          >
            {tag}
            <button
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove tag ${tag}`}
              className="rounded-sm p-0.5 hover:bg-[#d0d0d0]"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add(draft)
            } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-24 flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-subdued"
          aria-label={placeholder}
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 border-t border-border pt-1.5">
          {suggestions
            .filter((s) => !value.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="rounded-md border border-[#d0d0d0] px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface-hover hover:text-text"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
