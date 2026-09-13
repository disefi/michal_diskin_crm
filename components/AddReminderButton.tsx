'use client'
import { useState } from 'react'
import { saveNote } from '@/app/dashboard/actions'

/** כפתור + טופס מוקפץ להוספת תזכורת/פתק לתיק ספציפי - התזכורת תופיע גם בדשבורד */
export default function AddReminderButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm text-gray-600 hover:underline">
        ⏰ הוספת תזכורת לתיק
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30" onClick={() => setOpen(false)}>
          <form
            action={saveNote}
            onSubmit={() => setOpen(false)}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg p-5 w-96 space-y-3"
          >
            <h3 className="font-semibold">תזכורת חדשה לתיק</h3>
            <input type="hidden" name="project_id" value={projectId} />

            <input
              type="text"
              name="title"
              placeholder="כותרת (רשות)"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />

            <textarea
              name="content"
              placeholder="תוכן התזכורת"
              required
              rows={3}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />

            <div>
              <label className="text-xs text-gray-500 block mb-1">
                תזכורת בתאריך (רשות) - תופיע בדשבורד מהתאריך הזה
              </label>
              <input type="date" name="reminder_date" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-gray-500">
                ביטול
              </button>
              <button type="submit" className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded">
                שמירה
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
