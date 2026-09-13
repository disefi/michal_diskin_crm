'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProject } from '@/app/projects/actions'
import { unarchiveQuote } from '@/app/quotes/actions'
import ProjectFormModal from './ProjectFormModal'
import InlineStatusSelect from './InlineStatusSelect'
import InlineUrgencySelect from './InlineUrgencySelect'
import AddReminderButton from './AddReminderButton'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, ProjectStatus } from '@/lib/constants'

type Project = {
  id: string
  case_number: string | null
  street: string | null
  house_number: string | null
  city: string | null
  address_note: string | null
  additional_contact: string | null
  description: string | null
  status_id: string | null
  urgency_level: string
  client_id: string
  client: string
}

type Quote = {
  id: string
  quote_number: string
  status: string
  total: number
  subtotal: number
  discount: number
  created_at: string
  archived_at: string | null
  includes_construction: boolean
}
type Note = { id: string; title: string | null; content: string; reminder_date: string | null; created_at: string }

export default function ProjectDetail({
  project,
  clients,
  statuses,
  quotes,
  notes,
}: {
  project: Project
  clients: { id: string; name: string }[]
  statuses: ProjectStatus[]
  quotes: Quote[]
  notes: Note[]
}) {
  const [editing, setEditing] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(`למחוק את התיק "${addressLine}"? פעולה זו לא ניתנת לביטול.`)) return
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.error) setDeleteError(result.error)
      else router.push('/projects')
    })
  }

  function handleUnarchive(quoteId: string) {
    startTransition(() => {
      unarchiveQuote(quoteId, project.id)
    })
  }

  const addressLine = [project.street, project.house_number].filter(Boolean).join(' ')
  const activeQuotes = quotes.filter((q) => !q.archived_at)
  const archivedQuotes = quotes.filter((q) => q.archived_at)
  const latestActiveQuote = activeQuotes[0]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-gray-400 font-mono mb-1">תיק מס&apos; {project.case_number ?? '—'}</div>
            <h1 className="text-2xl font-bold">
              {addressLine}
              {project.city && <span>, {project.city}</span>}
            </h1>
            {project.address_note && <div className="text-sm text-gray-500">{project.address_note}</div>}
            <div className="text-sm text-gray-500 mt-1">{project.client}</div>
            {project.additional_contact && (
              <div className="text-sm text-gray-500 mt-1">👤 {project.additional_contact}</div>
            )}
            {latestActiveQuote && (
              <div className="text-xs text-gray-400 mt-1">
                כולל קונסטרוקציה: {latestActiveQuote.includes_construction ? 'כן' : 'לא'}
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <InlineStatusSelect projectId={project.id} statusId={project.status_id} statuses={statuses} />
            <InlineUrgencySelect projectId={project.id} urgency={project.urgency_level} />
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-gray-700 mt-4 whitespace-pre-line">{project.description}</p>
        )}

        {deleteError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{deleteError}</div>
        )}

        <div className="flex gap-4 mt-5 pt-4 border-t flex-wrap">
          <button onClick={() => setEditing(true)} className="text-sm text-gray-600 hover:underline">
            ✏️ עריכת פרטי תיק
          </button>
          <AddReminderButton projectId={project.id} />
          <button onClick={handleDelete} disabled={isPending} className="text-sm text-red-600 hover:underline disabled:opacity-40">
            🗑️ מחיקת תיק
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">📄 הצעות מחיר</h2>
          <Link
            href={`/quotes/new?project_id=${project.id}`}
            className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700"
          >
            + הצעה חדשה לתיק זה
          </Link>
        </div>
        {quotes.length === 0 && <p className="text-gray-400 text-sm">אין עדיין הצעות מחיר לתיק זה</p>}
        <ul className="space-y-1">
          {activeQuotes.map((q) => (
            <li key={q.id}>
              <Link
                href={`/quotes/${q.id}`}
                className="flex items-center justify-between gap-2 border-b py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <span className="text-sm font-medium">{q.quote_number}</span>
                <span className="text-sm text-gray-500">
                  ₪{Number(q.total).toLocaleString()}{' '}
                  <span className="text-xs text-gray-400">(₪{Number(q.subtotal - q.discount).toLocaleString()} לפני מע&quot;מ)</span>
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${QUOTE_STATUS_COLORS[q.status] ?? ''}`}>
                  {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {archivedQuotes.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-gray-400 mb-2">גרסאות קודמות (בארכיון)</p>
            <ul className="space-y-1">
              {archivedQuotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-2 py-1.5 text-sm text-gray-400">
                  <Link href={`/quotes/${q.id}`} className="hover:underline">
                    {q.quote_number} · ₪{Number(q.total).toLocaleString()}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">בארכיון</span>
                    <button
                      onClick={() => handleUnarchive(q.id)}
                      disabled={isPending}
                      className="text-xs text-gray-600 hover:underline disabled:opacity-40"
                    >
                      הוצא מארכיון
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {notes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">📝 פתקים לתיק זה</h2>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="border-b pb-2 text-sm">
                {n.title && <div className="font-medium">{n.title}</div>}
                <div className="text-gray-700">{n.content}</div>
                {n.reminder_date && <div className="text-xs text-orange-600 mt-1">⏰ {n.reminder_date}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <ProjectFormModal
          project={{
            id: project.id,
            client_id: project.client_id,
            street: project.street,
            house_number: project.house_number,
            city: project.city,
            address_note: project.address_note,
            additional_contact: project.additional_contact,
            description: project.description,
            status_id: project.status_id,
            urgency_level: project.urgency_level,
          }}
          clients={clients}
          statuses={statuses}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
