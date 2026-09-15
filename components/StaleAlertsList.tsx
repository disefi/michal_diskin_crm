'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { snoozeStaleProject } from '@/app/projects/actions'

export type StaleAlertRow = {
  id: string
  title: string
  client: string
  /** כמה ימים התיק כבר תקוע */
  days: number
  /** כמה ימים לדחות אם לוחצים "דחה" - תמיד = stale_after_days של הסטטוס הנוכחי */
  snoozeDays: number
}

/**
 * רשימת "🐌 תיקים תקועים" בדשבורד. לחיצה על שורה פותחת חלונית עם 3 אפשרויות:
 * דחייה ב-snoozeDays ימים, מעבר לתיק, או סגירה בלי לשנות כלום.
 */
export default function StaleAlertsList({ projects }: { projects: StaleAlertRow[] }) {
  const [selected, setSelected] = useState<StaleAlertRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSnooze() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await snoozeStaleProject(selected.id, selected.snoozeDays)
      if (result.error) setError(result.error)
      else setSelected(null)
    })
  }

  function closeModal() {
    setSelected(null)
    setError(null)
  }

  return (
    <>
      {projects.length === 0 ? (
        <p className="text-gray-400 text-sm">אין תיקים תקועים כרגע</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="w-full flex items-center justify-between text-sm border-b py-2 hover:bg-gray-50 -mx-2 px-2 rounded text-right"
              >
                <span>🐌 {p.title} ({p.client})</span>
                <span className="font-medium text-amber-700">{p.days} ימים ללא שינוי סטטוס</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-5 max-w-sm w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-semibold">🐌 {selected.title}</h3>
              <p className="text-sm text-gray-500">{selected.client} · תקוע {selected.days} ימים</p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSnooze}
                disabled={isPending}
                className="w-full text-sm bg-amber-100 text-amber-800 px-3 py-2 rounded hover:bg-amber-200 disabled:opacity-50"
              >
                ⏰ דחה ב-{selected.snoozeDays} ימים
              </button>
              <Link
                href={`/projects/${selected.id}`}
                className="block w-full text-center text-sm bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700"
              >
                🔎 פתח את התיק
              </Link>
              <button
                type="button"
                onClick={closeModal}
                className="w-full text-sm text-gray-500 px-3 py-2 rounded hover:bg-gray-50"
              >
                ✕ סגירה (השאר כהתראה)
              </button>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
