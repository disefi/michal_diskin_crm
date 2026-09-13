'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-80" ref={ref}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="חיפוש לקוח, פרויקט או כתובת..."
        className="border rounded-lg px-3 py-2 text-sm w-full"
      />
      {open && (
        <div className="absolute top-full mt-1 right-0 left-0 bg-white shadow-lg rounded-lg border z-20 max-h-80 overflow-y-auto">
          {results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">אין תוצאות</div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setOpen(false)
                setQuery('')
                router.push(`/projects/${r.id}`)
              }}
              className="w-full text-right px-4 py-2 hover:bg-gray-50 border-b last:border-0 flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-sm font-medium">{r.title}</div>
                <div className="text-xs text-gray-500">{r.client} · {r.address}</div>
                {r.case_number && <div className="text-xs text-gray-400 font-mono">{r.case_number}</div>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[r.status]}`}>
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}