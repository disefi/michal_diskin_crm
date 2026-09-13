'use client'
import { setProjectUrgency } from '@/app/projects/actions'
import { URGENCY_LABELS, URGENCY_COLORS } from '@/lib/constants'

/**
 * תג דחיפות לחיץ - לחיצה עליו הופכת אותו ל-select ומאפשרת לשנות דחיפות
 * ישירות מהטבלה/מהעמוד, בלי לפתוח את חלון העריכה המלאה.
 */
export default function InlineUrgencySelect({ projectId, urgency }: { projectId: string; urgency: string }) {
  return (
    <form action={setProjectUrgency} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="project_id" value={projectId} />
      <select
        name="urgency_level"
        defaultValue={urgency}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        onClick={(e) => e.stopPropagation()}
        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${URGENCY_COLORS[urgency] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {Object.entries(URGENCY_LABELS).map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
    </form>
  )
}
