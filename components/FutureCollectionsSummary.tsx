'use client'
import { useState } from 'react'
import Link from 'next/link'

export type FutureCollectionRow = {
  project_id: string
  project_title: string
  client: string
  amount: number
}

/**
 * Phase 9c - "גביות עתידיות": קופסה קטנה לא-פולשנית בראש עמוד התשלומים, מציגה
 * סכום כולל (כל ההצעות שאושרו, פחות מה ששולם/שולם חלקית) + פירוט לפי תיק
 * בלחיצה. אותו נתון בדיוק כמו הסכומים הפתוחים בטבלה למטה, רק ברמת סיכום.
 */
export default function FutureCollectionsSummary({
  total,
  rows,
}: {
  total: number
  rows: FutureCollectionRow[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2.5 hover:ring-2 hover:ring-gray-300"
      >
        <span className="text-sm text-gray-500">💰 גביות עתידיות</span>
        <span className="text-base font-semibold">₪{total.toLocaleString()}</span>
        <span className={`text-xs text-gray-400 inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>

      {open && (
        <div className="bg-white rounded-lg shadow mt-2 p-3 max-w-md">
          {rows.length === 0 ? (
            <p className="text-gray-400 text-sm">אין גביות עתידיות כרגע</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.project_id} className="flex items-center justify-between py-2 text-sm gap-3">
                  <Link href={`/projects/${r.project_id}`} className="hover:underline">
                    {r.project_title} ({r.client})
                  </Link>
                  <span className="font-medium whitespace-nowrap">₪{r.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
