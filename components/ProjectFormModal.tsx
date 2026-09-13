'use client'
import { saveProject } from '@/app/projects/actions'
import { URGENCY_LABELS, ProjectStatus } from '@/lib/constants'

type Project = {
  id: string
  client_id: string
  street: string | null
  house_number: string | null
  city: string | null
  address_note: string | null
  additional_contact: string | null
  description: string | null
  status_id: string | null
  urgency_level: string
}

export default function ProjectFormModal({
  project,
  clients,
  statuses,
  onClose,
}: {
  project: Project
  clients: { id: string; name: string }[]
  statuses: ProjectStatus[]
  onClose: () => void
}) {
  // כמו ב-InlineStatusSelect: כוללים סטטוס מושבת ברשימה רק אם הוא הערך הנוכחי בפועל
  const statusOptions = statuses.filter((s) => s.is_active || s.id === project.status_id)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30" onClick={onClose}>
      <form
        action={saveProject}
        onSubmit={onClose}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-lg p-5 w-96 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-semibold">עריכת תיק</h3>
        <input type="hidden" name="id" value={project.id} />

        <div>
          <label className="text-xs text-gray-500 block mb-1">לקוח *</label>
          <select name="client_id" required defaultValue={project.client_id} className="w-full border rounded px-2 py-1.5 text-sm">
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">רחוב *</label>
            <input type="text" name="street" required defaultValue={project.street ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">מספר</label>
            <input type="text" name="house_number" defaultValue={project.house_number ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">עיר *</label>
          <input type="text" name="city" required defaultValue={project.city ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">כותרת נוספת (רשות)</label>
          <input type="text" name="address_note" defaultValue={project.address_note ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">איש קשר נוסף / משרד מלווה (רשות)</label>
          <input type="text" name="additional_contact" defaultValue={project.additional_contact ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">תיאור</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={project.description ?? ''}
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">סטטוס</label>
            <select name="status_id" defaultValue={project.status_id ?? ''} className="w-full border rounded px-2 py-1.5 text-sm">
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">דחיפות</label>
            <select name="urgency_level" defaultValue={project.urgency_level} className="w-full border rounded px-2 py-1.5 text-sm">
              {Object.entries(URGENCY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-500">
            ביטול
          </button>
          <button type="submit" className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded">
            שמירה
          </button>
        </div>
      </form>
    </div>
  )
}
