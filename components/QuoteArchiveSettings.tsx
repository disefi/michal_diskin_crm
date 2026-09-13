'use client'
import { useState, useTransition } from 'react'
import { saveQuoteArchiveMonths } from '@/app/settings/actions'

export default function QuoteArchiveSettings({ months }: { months: number }) {
  const [value, setValue] = useState(months)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData()
    formData.set('months', String(value))
    startTransition(async () => {
      const result = await saveQuoteArchiveMonths(formData)
      if (result.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-xl">
      <h2 className="text-lg font-semibold mb-1">ארכיון אוטומטי להצעות מחיר</h2>
      <p className="text-sm text-gray-500 mb-4">
        כל הצעת מחיר שעברו עליה כמה שנקבע כאן חודשים מיצירתה עוברת אוטומטית לארכיון,
        אלא אם הוצאה ממנו ידנית.
      </p>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">מעבר לארכיון אחרי (חודשים)</label>
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value, 10) || 1)}
            onWheel={(e) => e.currentTarget.blur()}
            className="border rounded px-2 py-1.5 text-sm w-28"
          />
        </div>
        <button type="submit" disabled={isPending} className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded disabled:opacity-50">
          שמירה
        </button>
      </form>

      {error && <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}
      {success && <div className="mt-3 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">נשמר בהצלחה</div>}
    </div>
  )
}
