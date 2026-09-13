'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import SortableHeader from './SortableHeader'
import { useSort } from '@/lib/useSort'
import { setMilestoneStatus, toggleConditionMet } from '@/app/collections/actions'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/constants'

export type MilestoneRow = {
  id: string
  title: string
  amount: number
  status: string
  condition_met: boolean
  project_id: string
  project_title: string
  client: string
  trigger_status_label?: string | null
  trigger_status_color?: string | null
}

export default function CollectionsTable({ milestones }: { milestones: MilestoneRow[] }) {
  const [isPending, startTransition] = useTransition()
  const { sorted, sortKey, sortDir, toggleSort } = useSort<MilestoneRow>(milestones, 'status', 'asc')

  function handleConditionToggle(id: string, met: boolean) {
    startTransition(() => {
      toggleConditionMet(id, met)
    })
  }

  function handleStatusChange(id: string, status: string) {
    const formData = new FormData()
    formData.set('milestone_id', id)
    formData.set('status', status)
    startTransition(() => {
      setMilestoneStatus(formData)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-gray-100 text-sm text-gray-600">
          <tr>
            <SortableHeader label="שלב" sortKey="title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            <SortableHeader label="תיק" sortKey="project_title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            <SortableHeader label="לקוח" sortKey="client" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            <SortableHeader label="סכום" sortKey="amount" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            <th className="p-3">תגית שלב</th>
            <th className="p-3">התקיים?</th>
            <SortableHeader label="סטטוס" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => (
            <tr key={m.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{m.title}</td>
              <td className="p-3">
                <Link href={`/projects/${m.project_id}`} className="hover:underline">{m.project_title}</Link>
              </td>
              <td className="p-3">{m.client}</td>
              <td className="p-3">₪{Number(m.amount).toLocaleString()}</td>
              <td className="p-3">
                {m.trigger_status_label ? (
                  <span className={`text-xs px-2 py-1 rounded-full ${m.trigger_status_color ?? 'bg-gray-100 text-gray-600'}`}>
                    {m.trigger_status_label}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </td>
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={m.condition_met}
                  disabled={isPending}
                  onChange={(e) => handleConditionToggle(m.id, e.target.checked)}
                  className="w-4 h-4"
                />
              </td>
              <td className="p-3">
                <select
                  value={m.status}
                  disabled={isPending}
                  onChange={(e) => handleStatusChange(m.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${PAYMENT_STATUS_COLORS[m.status] ?? ''}`}
                >
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-400">אין נתוני גבייה עדיין</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
