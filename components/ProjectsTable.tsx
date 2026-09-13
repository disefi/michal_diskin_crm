'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteProject } from '@/app/projects/actions'
import ProjectFormModal from './ProjectFormModal'
import InlineStatusSelect from './InlineStatusSelect'
import InlineUrgencySelect from './InlineUrgencySelect'
import SortableHeader from './SortableHeader'
import { useSort } from '@/lib/useSort'
import { ProjectStatus } from '@/lib/constants'

export type ProjectRow = {
  id: string
  case_number: string | null
  title: string
  client: string
  client_id: string
  address: string | null
  street: string | null
  house_number: string | null
  city: string | null
  address_note: string | null
  additional_contact: string | null
  description: string | null
  status_id: string | null
  urgency_level: string
  created_at: string
}

/**
 * טבלת פרויקטים משותפת - משמשת גם ב-/projects, גם ב-/in-progress, גם ב-/archive
 * וגם בטבלת "תיקים אחרונים" בדשבורד. כוללת מיון לכל עמודה, שינוי סטטוס/דחיפות
 * inline, עריכה ומחיקה (ניתן לכבות עריכה/מחיקה באמצעות showActions - למשל בדשבורד).
 * מקבלת statuses (רשימת project_statuses מה-DB) כ-prop - הקורא (page.tsx) אחראי
 * לשלוף אותה ולהעביר, כדי שלא כל שורת טבלה תשלוף בעצמה.
 */
export default function ProjectsTable({
  projects,
  clients,
  statuses,
  showStatusFilter = true,
  showActions = true,
}: {
  projects: ProjectRow[]
  clients: { id: string; name: string }[]
  statuses: ProjectStatus[]
  showStatusFilter?: boolean
  showActions?: boolean
}) {
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<ProjectRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sortedStatuses = [...statuses].sort((a, b) => a.sort_order - b.sort_order)
  const filtered = statusFilter ? projects.filter((p) => p.status_id === statusFilter) : projects
  const { sorted, sortKey, sortDir, toggleSort } = useSort<ProjectRow>(filtered, 'created_at', 'desc')

  function handleDelete(p: ProjectRow) {
    if (!confirm(`למחוק את התיק "${p.title}"? פעולה זו לא ניתנת לביטול.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteProject(p.id)
      if (result.error) setDeleteError(result.error)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-gray-500">{sorted.length} תיקים</p>
        {showStatusFilter && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">כל הסטטוסים</option>
            {sortedStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{deleteError}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr>
              <SortableHeader label="מס' תיק" sortKey="case_number" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="כותרת" sortKey="title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="לקוח" sortKey="client" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="כתובת" sortKey="address" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="סטטוס" sortKey="status_id" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="דחיפות" sortKey="urgency_level" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              {showActions && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.case_number ?? '—'}</td>
                <td className="p-0">
                  <Link href={`/projects/${p.id}`} className="block p-3 font-medium">{p.title}</Link>
                </td>
                <td className="p-3">{p.client}</td>
                <td className="p-3">{p.address ?? '-'}</td>
                <td className="p-3"><InlineStatusSelect projectId={p.id} statusId={p.status_id} statuses={statuses} /></td>
                <td className="p-3"><InlineUrgencySelect projectId={p.id} urgency={p.urgency_level} /></td>
                {showActions && (
                  <td className="p-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => setEditing(p)} title="עריכה" className="text-gray-500 hover:scale-110 transition">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={isPending}
                        title="מחיקה"
                        className="text-red-500 hover:scale-110 transition disabled:opacity-40"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">אין תיקים</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProjectFormModal
          project={{
            id: editing.id,
            client_id: editing.client_id,
            street: editing.street,
            house_number: editing.house_number,
            city: editing.city,
            address_note: editing.address_note,
            additional_contact: editing.additional_contact,
            description: editing.description,
            status_id: editing.status_id,
            urgency_level: editing.urgency_level,
          }}
          clients={clients}
          statuses={statuses}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
