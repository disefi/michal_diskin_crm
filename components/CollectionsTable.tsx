'use client'
import { Fragment, useState } from 'react'
import Link from 'next/link'
import MilestoneStatusControl from './MilestoneStatusControl'

export type MilestoneRow = {
  id: string
  title: string
  amount: number
  status: string
  /** Phase 9b - כמה שולם בפועל, רלוונטי בעיקר לסטטוס 'partial' */
  paid_amount: number
  project_id: string
  project_title: string
  client: string
  trigger_status_label?: string | null
  trigger_status_color?: string | null
}

type ProjectGroup = {
  project_id: string
  project_title: string
  client: string
  /** סכום הנותר לגבייה בפועל בקבוצה - לא סתם סכום כל השלבים, אלא בניכוי מה ששולם חלקית */
  outstandingTotal: number
  milestones: MilestoneRow[]
}

function outstanding(m: MilestoneRow): number {
  return m.status === 'partial' ? Math.max(0, Number(m.amount) - Number(m.paid_amount)) : Number(m.amount)
}

function groupByProject(milestones: MilestoneRow[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>()
  for (const m of milestones) {
    const existing = map.get(m.project_id)
    if (existing) {
      existing.milestones.push(m)
      existing.outstandingTotal += outstanding(m)
    } else {
      map.set(m.project_id, {
        project_id: m.project_id,
        project_title: m.project_title,
        client: m.client,
        outstandingTotal: outstanding(m),
        milestones: [m],
      })
    }
  }
  return Array.from(map.values())
}

/**
 * "תשלומים" (Phase 9 + 9b) - מציג רק שלבי תשלום שעדיין לא שולמו במלואם
 * ("pending"/"requested"/"partial"). שלבים ששולמו במלואם מתועדים ב-PaidPaymentsList.
 * אם לתיק יש 2+ שלבים פתוחים, הם מקובצים לשורה אחת מתקפלת (accordion).
 */
export default function CollectionsTable({ milestones }: { milestones: MilestoneRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const groups = groupByProject(milestones)

  function toggleExpand(projectId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  function renderMilestoneRow(m: MilestoneRow, indented: boolean) {
    return (
      <tr key={m.id} className="border-t hover:bg-gray-50">
        <td className={`p-3 ${indented ? 'pr-8 text-gray-600' : ''}`}>{m.title}</td>
        <td className="p-3">
          {!indented && (
            <Link href={`/projects/${m.project_id}`} className="hover:underline">
              {m.project_title}
            </Link>
          )}
        </td>
        <td className="p-3">{!indented && m.client}</td>
        <td className="p-3">
          {m.status === 'partial' ? (
            <span>
              ₪{Number(m.paid_amount).toLocaleString()} מתוך ₪{Number(m.amount).toLocaleString()}
            </span>
          ) : (
            <span>₪{Number(m.amount).toLocaleString()}</span>
          )}
        </td>
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
          <MilestoneStatusControl id={m.id} status={m.status} amount={m.amount} paidAmount={m.paid_amount} />
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-gray-100 text-sm text-gray-600">
          <tr>
            <th className="p-3">שלב</th>
            <th className="p-3">תיק</th>
            <th className="p-3">לקוח</th>
            <th className="p-3">סכום</th>
            <th className="p-3">תגית שלב</th>
            <th className="p-3">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            if (g.milestones.length === 1) return renderMilestoneRow(g.milestones[0], false)

            const isOpen = expanded.has(g.project_id)
            return (
              <Fragment key={g.project_id}>
                <tr
                  className="border-t hover:bg-gray-50 cursor-pointer bg-gray-50"
                  onClick={() => toggleExpand(g.project_id)}
                >
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className={`inline-block transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                      {g.milestones.length} פריטים
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/projects/${g.project_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {g.project_title}
                    </Link>
                  </td>
                  <td className="p-3">{g.client}</td>
                  <td className="p-3 font-medium">₪{g.outstandingTotal.toLocaleString()}</td>
                  <td className="p-3" />
                  <td className="p-3" />
                </tr>
                {isOpen && g.milestones.map((m) => renderMilestoneRow(m, true))}
              </Fragment>
            )
          })}
          {groups.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-gray-400">אין תשלומים ממתינים כרגע</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
