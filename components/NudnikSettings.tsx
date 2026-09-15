'use client'
import { useState, useTransition } from 'react'
import { saveNudnikSettings } from '@/app/settings/actions'
import { NudnikSettings as NudnikSettingsType } from '@/lib/constants'

/**
 * הגדרה גלובלית יחידה למנגנון ה"נודניק" - האם דחיית התראה (snooze) מסתירה
 * גם את התג 🐌 בטבלאות/עמוד התיק, או שהתג ממשיך להופיע תמיד גם בזמן דחייה.
 * רשימת ההתראות בדשבורד עצמה תמיד מכבדת דחייה, ללא קשר להגדרה הזו.
 */
export default function NudnikSettings({ settings }: { settings: NudnikSettingsType }) {
  const [hide, setHide] = useState(settings.hide_badge_while_snoozed)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleChange(value: boolean) {
    setHide(value)
    setSaved(false)
    setError(null)
    const formData = new FormData()
    formData.set('hide_badge_while_snoozed', String(value))
    startTransition(async () => {
      const result = await saveNudnikSettings(formData)
      if (result.error) setError(result.error)
      else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <h2 className="font-semibold">🐌 נודניק - תיקים תקועים</h2>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={hide}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-4 h-4"
        />
        דחיית התראה (⏰) מסתירה גם את התג 🐌 בטבלאות ובעמוד התיק, לא רק ברשימת הדשבורד
      </label>
      <p className="text-xs text-gray-400">
        גם אם מכבים את זה - רשימת ההתראות בדשבורד עצמה תמיד מכבדת דחייה ולא תציג תיק דחוי.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-600">נשמר</p>}
    </div>
  )
}
