'use client'
import { useState, useTransition } from 'react'
import {
  addProjectStatus,
  updateProjectStatus,
  deactivateProjectStatus,
  reactivateProjectStatus,
  deleteProjectStatus,
  reorderProjectStatuses,
} from '@/app/settings/actions'
import { VISIBLE_IN_OPTIONS, VISIBLE_IN_LABELS, ProjectStatus } from '@/lib/constants'

const COLOR_CHOICES = [
  { value: 'bg-gray-100 text-gray-800', label: 'אפור' },
  { value: 'bg-blue-100 text-blue-800', label: 'כחול' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'צהוב' },
  { value: 'bg-orange-100 text-orange-800', label: 'כתום' },
  { value: 'bg-purple-100 text-purple-800', label: 'סגול' },
  { value: 'bg-green-100 text-green-800', label: 'ירוק' },
  { value: 'bg-red-100 text-red-800', label: 'אדום' },
]

function VisibleInCheckboxes({
  namePrefix,
  defaultValues,
}: {
  namePrefix: string
  defaultValues: string[]
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
      {VISIBLE_IN_OPTIONS.map((opt) => (
        <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            name={`${namePrefix}_${opt}`}
            value="true"
            defaultChecked={defaultValues.includes(opt)}
            className="w-3.5 h-3.5"
          />
          {VISIBLE_IN_LABELS[opt]}
        </label>
      ))}
    </div>
  )
}

function StatusRow({
  status,
  isFirst,
  isLast,
  onMove,
}: {
  status: ProjectStatus
  isFirst: boolean
  isLast: boolean
  onMove: (id: string, direction: 'up' | 'down') => void
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSave(formData: FormData) {
    setError(null)
    formData.set('id', status.id)
    startTransition(async () => {
      const result = await updateProjectStatus(formData)
      if (result.error) setError(result.error)
      else setEditing(false)
    })
  }

  function handleToggleActive() {
    setError(null)
    startTransition(() => {
      if (status.is_active) deactivateProjectStatus(status.id)
      else reactivateProjectStatus(status.id)
    })
  }

  function handleDelete() {
    if (!confirm(`למחוק לצמיתות את הסטטוס "${status.label}"? פעולה זו לא ניתנת לביטול.`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteProjectStatus(status.id)
      if (result.error) setError(result.error)
    })
  }

  if (editing) {
    return (
      <form action={handleSave} className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            name="label"
            defaultValue={status.label}
            required
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <select name="color" defaultValue={status.color} className="border rounded px-2 py-1 text-sm">
            {COLOR_CHOICES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <VisibleInCheckboxes namePrefix="visible_in" defaultValues={status.visible_in} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-gray-500 px-2 py-1">
            ביטול
          </button>
          <button type="submit" disabled={isPending} className="text-xs bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50">
            שמירה
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-1">
      <div className={`border rounded-lg p-3 flex items-center gap-3 ${!status.is_active ? 'opacity-50' : ''}`}>
        <div className="flex flex-col">
          <button
            type="button"
            disabled={isFirst || isPending}
            onClick={() => onMove(status.id, 'up')}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none text-xs"
          >
            ▲
          </button>
          <button
            type="button"
            disabled={isLast || isPending}
            onClick={() => onMove(status.id, 'down')}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none text-xs"
          >
            ▼
          </button>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
        <div className="flex-1 flex flex-wrap gap-1">
          {status.visible_in.length === 0 ? (
            <span className="text-xs text-gray-400">לא מוצג בשום מקום</span>
          ) : (
            status.visible_in.map((v) => (
              <span key={v} className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {VISIBLE_IN_LABELS[v as keyof typeof VISIBLE_IN_LABELS] ?? v}
              </span>
            ))
          )}
        </div>
        {!status.is_active && <span className="text-xs text-gray-400">מושבת</span>}
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="text-gray-500 hover:scale-110 transition" title="עריכה">
            ✏️
          </button>
          <button onClick={handleToggleActive} disabled={isPending} className="text-gray-500 hover:scale-110 transition disabled:opacity-40" title={status.is_active ? 'השבתה' : 'הפעלה'}>
            {status.is_active ? '🚫' : '♻️'}
          </button>
          <button onClick={handleDelete} disabled={isPending} className="text-red-500 hover:scale-110 transition disabled:opacity-40" title="מחיקה לצמיתות (רק אם לא בשימוש)">
            🗑️
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 px-1">{error}</p>}
    </div>
  )
}

export default function ProjectStatusesSettings({ statuses: initialStatuses }: { statuses: ProjectStatus[] }) {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [showAdd, setShowAdd] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sorted = [...statuses].sort((a, b) => a.sort_order - b.sort_order)

  async function handleAdd(formData: FormData) {
    setAddError(null)
    startTransition(async () => {
      const result = await addProjectStatus(formData)
      if (result.error) {
        setAddError(result.error)
      } else {
        setShowAdd(false)
      }
    })
  }

  function handleMove(id: string, direction: 'up' | 'down') {
    const idx = sorted.findIndex((s) => s.id === id)
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= sorted.length) return
    const reordered = [...sorted]
    ;[reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]]
    setStatuses(reordered.map((s, i) => ({ ...s, sort_order: i })))
    startTransition(() => {
      reorderProjectStatuses(reordered.map((s) => s.id))
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">סטטוסי תיק</h2>
        <button type="button" onClick={() => setShowAdd((v) => !v)} className="text-sm text-gray-600 hover:underline">
          {showAdd ? 'ביטול' : '+ סטטוס חדש'}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        לכל סטטוס אפשר לבחור באילו מסכים הוא יופיע. סטטוס שלא מסומן ב&quot;גבייה&quot; עדיין יופיע שם
        אם יש לתיק תשלום שלא שולם - כדי שלא תפספס גבייה בטעות. מחיקה לצמיתות (🗑️) מתאפשרת רק אם
        אין שום תיק/הצעה/שלב גבייה שמשתמשים בסטטוס הזה כרגע - אחרת יש להשבית (🚫) במקום.
      </p>

      {showAdd && (
        <form action={handleAdd} className="border rounded-lg p-3 space-y-2 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              name="label"
              placeholder="שם הסטטוס"
              required
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <select name="color" defaultValue={COLOR_CHOICES[0].value} className="border rounded px-2 py-1 text-sm">
              {COLOR_CHOICES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <VisibleInCheckboxes namePrefix="visible_in" defaultValues={['projects', 'dashboard']} />
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={isPending} className="text-xs bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50">
              הוספה
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {sorted.map((s, i) => (
          <StatusRow
            key={s.id}
            status={s}
            isFirst={i === 0}
            isLast={i === sorted.length - 1}
            onMove={handleMove}
          />
        ))}
        {sorted.length === 0 && <p className="text-sm text-gray-400 text-center py-4">אין סטטוסים עדיין</p>}
      </div>
    </div>
  )
}
