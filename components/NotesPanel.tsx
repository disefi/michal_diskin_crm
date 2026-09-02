'use client'
import { useState } from 'react'
import { saveNote, deleteNote, completeNote } from '@/app/dashboard/actions'

type Note = {
  id: string
  title: string | null
  content: string
  project_id: string | null
  reminder_date: string | null
}

export default function NotesPanel({
  notes,
  futureCount,
  projects,
}: {
  notes: Note[]
  futureCount: number
  projects: { id: string; title: string }[]
}) {
  const [editing, setEditing] = useState<Note | 'new' | null>(null)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">📝 פתקים ותזכורות</h2>
        <button
          onClick={() => setEditing('new')}
          className="w-7 h-7 rounded-full bg-gray-800 text-white text-lg leading-none flex items-center justify-center hover:bg-gray-700"
        >
          +
        </button>
      </div>

      <ul className="space-y-2 max-h-72 overflow-y-auto">
        {notes.map((n) => (
          <li key={n.id} className="border-b pb-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {n.title && <div className="font-medium">{n.title}</div>}
                <div className="text-gray-700">{n.content}</div>
                {n.reminder_date && (
                  <div className="text-xs text-orange-600 mt-1">⏰ {n.reminder_date}</div>
                )}
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                <form action={completeNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" title="סמן כהושלם" className="text-green-600 hover:scale-110 transition">
                    ✓
                  </button>
                </form>
                <button onClick={() => setEditing(n)} title="עריכה" className="text-gray-500 hover:scale-110 transition">
                  ✏️
                </button>
                <form action={deleteNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" title="מחיקה" className="text-red-500 hover:scale-110 transition">
                    🗑️
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
        {notes.length === 0 && <li className="text-gray-400 text-sm">אין פתקים עדיין</li>}
      </ul>

      {futureCount > 0 && (
        <p className="text-xs text-gray-400 mt-3 pt-2 border-t">
          יש {futureCount} תזכורות עתידיות שיופיעו בתאריך שנקבע להן
        </p>
      )}

      {editing && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-30"
          onClick={() => setEditing(null)}
        >
          <form
            action={saveNote}
            onSubmit={() => setEditing(null)}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg p-5 w-96 space-y-3"
          >
            <h3 className="font-semibold">{editing === 'new' ? 'פתק חדש' : 'עריכת פתק'}</h3>
            {editing !== 'new' && <input type="hidden" name="id" value={editing.id} />}

            <select
              name="project_id"
              defaultValue={editing !== 'new' ? editing.project_id ?? '' : ''}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">כללי (לא משויך לתיק)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            <input
              type="text"
              name="title"
              defaultValue={editing !== 'new' ? editing.title ?? '' : ''}
              placeholder="כותרת (רשות)"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />

            <textarea
              name="content"
              defaultValue={editing !== 'new' ? editing.content : ''}
              placeholder="תוכן הפתק"
              required
              rows={3}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />

            <div>
              <label className="text-xs text-gray-500 block mb-1">
                תזכורת בתאריך (רשות) - הפתק יוסתר עד שיגיע התאריך
              </label>
              <input
                type="date"
                name="reminder_date"
                defaultValue={editing !== 'new' ? editing.reminder_date ?? '' : ''}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 text-sm text-gray-500">
                ביטול
              </button>
              <button type="submit" className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded">
                שמירה
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}