'use client'
import { useState, useTransition } from 'react'
import { saveCaseNumberSetting } from '@/app/settings/actions'

type Setting = { year: number; start_number: number }
type Counter = { year: number; last_number: number }

export default function CaseNumberSettings({ settings, counters }: { settings: Setting[]; counters: Counter[] }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [startNumber, setStartNumber] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const counterMap = new Map(counters.map((c) => [c.year, c.last_number]))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData()
    formData.set('year', String(year))
    formData.set('start_number', String(startNumber))
    startTransition(async () => {
      const result = await saveCaseNumberSetting(formData)
      if (result.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-xl">
      <h2 className="text-lg font-semibold mb-1">מספור תיקים</h2>
      <p className="text-sm text-gray-500 mb-4">
        קביעת נקודת ההתחלה של מספר התיק לכל שנה (לדוגמה: 2026 מתחיל מ-45). ניתן לשנות רק
        עבור שנה שעדיין לא הונפקו לה מספרי תיק - לאחר ההנפקה הראשונה נקודת ההתחלה ננעלת.
      </p>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 mb-5 flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">שנה</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || currentYear)}
            className="border rounded px-2 py-1.5 text-sm w-28"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">מתחיל מ-</label>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
            className="border rounded px-2 py-1.5 text-sm w-28"
          />
        </div>
        <button type="submit" disabled={isPending} className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded disabled:opacity-50">
          שמירה
        </button>
      </form>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">נשמר בהצלחה</div>}

      <table className="w-full text-right text-sm">
        <thead className="text-gray-500 border-b">
          <tr>
            <th className="p-2">שנה</th>
            <th className="p-2">נקודת התחלה</th>
            <th className="p-2">מספר תיק אחרון שהונפק</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((s) => (
            <tr key={s.year} className="border-b">
              <td className="p-2">{s.year}</td>
              <td className="p-2">{s.start_number}</td>
              <td className="p-2">{counterMap.get(s.year) ?? '—'}</td>
            </tr>
          ))}
          {settings.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center text-gray-400">
                אין הגדרות עדיין - ברירת המחדל היא התחלה מ-1 לכל שנה חדשה
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
