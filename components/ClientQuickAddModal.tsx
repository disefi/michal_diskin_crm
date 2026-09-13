'use client'
import { useState } from 'react'
import { quickAddClient } from '@/app/clients/actions'

export default function ClientQuickAddModal({
  onCreated,
  onClose,
}: {
  onCreated: (client: { id: string; name: string }) => void
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)
    const result = await quickAddClient(formData)
    setSubmitting(false)
    if (result.error || !result.client) {
      setError(result.error ?? 'שגיאה ביצירת הלקוח')
      return
    }
    onCreated(result.client)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" onClick={onClose}>
      <form
        action={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-lg p-5 w-96 space-y-3"
      >
        <h3 className="font-semibold">לקוח חדש</h3>

        <div>
          <label className="text-xs text-gray-500 block mb-1">שם *</label>
          <input type="text" name="name" required autoFocus className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">טלפון</label>
          <input type="text" name="phone" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">אימייל</label>
          <input type="email" name="email" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">כתובת</label>
          <input type="text" name="address" className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        {error && <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">{error}</div>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-500">
            ביטול
          </button>
          <button type="submit" disabled={submitting} className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded disabled:opacity-50">
            {submitting ? 'שומר...' : 'הוספה ובחירה'}
          </button>
        </div>
      </form>
    </div>
  )
}
