'use client'
import { setProjectStatus } from '@/app/projects/actions'
import { ProjectStatus } from '@/lib/constants'

/**
 * תג סטטוס לחיץ - לחיצה עליו הופכת אותו ל-select ומאפשרת לשנות סטטוס
 * ישירות מהטבלה/מהעמוד, בלי לפתוח את חלון העריכה המלאה.
 * מקבל את רשימת הסטטוסים הפעילים כ-prop (מ-project_statuses ב-DB) במקום
 * מ-STATUS_LABELS הקבוע - כך שהיא ניתנת לעריכה מלאה דרך מסך ההגדרות.
 */
export default function InlineStatusSelect({
  projectId,
  statusId,
  statuses,
}: {
  projectId: string
  statusId: string | null
  statuses: ProjectStatus[]
}) {
  const current = statuses.find((s) => s.id === statusId)
  const currentColor = current?.color ?? 'bg-gray-100 text-gray-800'
  // רשימת הבחירה כוללת גם סטטוסים מושבתים, אבל רק אם הם הערך הנוכחי בפועל -
  // כדי לא "לאבד" תיק ישן שמשויך לסטטוס שכבר הושבת
  const options = statuses.filter((s) => s.is_active || s.id === statusId)

  return (
    <form action={setProjectStatus} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="project_id" value={projectId} />
      <select
        name="status_id"
        defaultValue={statusId ?? ''}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        onClick={(e) => e.stopPropagation()}
        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${currentColor}`}
      >
        {!current && <option value="">— ללא סטטוס —</option>}
        {options.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </form>
  )
}
