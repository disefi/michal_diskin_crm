'use client'
import { useState } from 'react'
import Link from 'next/link'
import { setUrgency } from '@/app/dashboard/actions'
import { URGENCY_LABELS, URGENCY_COLORS } from '@/lib/constants'

type P = { id: string; title: string; client: string; address?: string; urgency_level?: string }

export default function UrgentCard({
  allProjects,
  urgentProjects,
}: {
  allProjects: P[]
  urgentProjects: Required<P>[]
}) {
  const [open, setOpen] = useState(false)

  const sorted = [...urgentProjects].sort((a, b) =>
    a.urgency_level === b.urgency_level ? 0 : a.urgency_level === 'critical' ? -1 : 1
  )

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">🔥 תיקים דחופים</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-7 h-7 rounded-full bg-gray-800 text-white text-lg leading-none flex items-center justify-center hover:bg-gray-700"
          title="סמן תיק כדחוף"
        >
          +
        </button>
      </div>

      {open && (
        <form
          action={setUrgency}
          onSubmit={() => setOpen(false)}
          className="mb-4 border rounded-lg p-3 bg-gray-50 space-y-2"
        >
          <select name="project_id" required className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="">בחר/י תיק...</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.title} · {p.client}</option>
            ))}
          </select>
          <select name="urgency_level" required defaultValue="urgent" className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="normal">רגילה</option>
            <option value="urgent">דחופה</option>
            <option value="critical">קריטית</option>
          </select>
          <button type="submit" className="w-full bg-gray-800 text-white rounded px-3 py-1.5 text-sm">
            שמור
          </button>
        </form>
      )}

      {sorted.length === 0 && <p className="text-gray-400 text-sm">אין תיקים מסומנים כדחופים</p>}
      <ul className="space-y-2">
        {sorted.map((p) => (
          <li key={p.id} className="flex items-center justify-between border-b pb-2 gap-2">
            <Link href={`/projects/${p.id}`} className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{p.title}</div>
              <div className="text-xs text-gray-500 truncate">{p.client} · {p.address}</div>
            </Link>
            <form action={setUrgency} className="shrink-0">
              <input type="hidden" name="project_id" value={p.id} />
              <select
                name="urgency_level"
                defaultValue={p.urgency_level}
                onChange={(e) => e.target.form?.requestSubmit()}
                className={`text-xs px-2 py-1 rounded-full border-0 ${URGENCY_COLORS[p.urgency_level!]}`}
              >
                <option value="normal">{URGENCY_LABELS.normal}</option>
                <option value="urgent">{URGENCY_LABELS.urgent}</option>
                <option value="critical">{URGENCY_LABELS.critical}</option>
              </select>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}