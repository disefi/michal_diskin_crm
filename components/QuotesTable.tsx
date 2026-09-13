'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SortableHeader from './SortableHeader'
import InlineQuoteStatusSelect from './InlineQuoteStatusSelect'
import { useSort } from '@/lib/useSort'
import { QUOTE_STATUS_LABELS } from '@/lib/constants'

export type QuoteRow = {
  id: string
  quote_number: string
  status: string
  total: number
  subtotal: number
  discount: number
  created_at: string
  project_id: string
  project_title: string
  case_number: string | null
  client: string
}

export default function QuotesTable({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const filtered = statusFilter ? quotes.filter((q) => q.status === statusFilter) : quotes
  const { sorted, sortKey, sortDir, toggleSort } = useSort<QuoteRow>(filtered, 'created_at', 'desc')

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-gray-500">{sorted.length} הצעות מחיר</p>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="">כל הסטטוסים</option>
          {Object.entries(QUOTE_STATUS_LABELS).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr>
              <SortableHeader label="מס' הצעה" sortKey="quote_number" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="תיק" sortKey="project_title" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="לקוח" sortKey="client" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="סכום" sortKey="total" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="סטטוס" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              <SortableHeader label="נוצרה" sortKey="created_at" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((q) => (
              <tr
                key={q.id}
                onClick={() => router.push(`/quotes/${q.id}`)}
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-3 font-medium">{q.quote_number}</td>
                <td className="p-3">
                  <div className="text-sm">{q.project_title}</div>
                  <div className="text-xs text-gray-400 font-mono">{q.case_number ?? '—'}</div>
                </td>
                <td className="p-3">{q.client}</td>
                <td className="p-3">
                  ₪{Number(q.total).toLocaleString()}{' '}
                  <span className="text-xs text-gray-400">(₪{Number(q.subtotal - q.discount).toLocaleString()} לפני מע&quot;מ)</span>
                </td>
                <td className="p-3">
                  <InlineQuoteStatusSelect quoteId={q.id} projectId={q.project_id} status={q.status} />
                </td>
                <td className="p-3 text-sm text-gray-500">{new Date(q.created_at).toLocaleDateString('he-IL')}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">אין הצעות מחיר</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
