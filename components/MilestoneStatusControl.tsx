'use client'
import { useState, useTransition } from 'react'
import { setMilestoneStatus } from '@/app/collections/actions'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/lib/constants'

/**
 * Phase 9b - שדה סטטוס יחיד לשלב תשלום (במקום condition_met+status כפולים).
 * כשבוחרים 'partial' נפתח שדה סכום נוסף שצריך לשמור בנפרד (כי צריך להקליד מספר),
 * לכל סטטוס אחר השינוי נשמר מיד עם הבחירה.
 */
export default function MilestoneStatusControl({
  id,
  status,
  amount,
  paidAmount,
}: {
  id: string
  status: string
  amount: number
  paidAmount: number
}) {
  const [localStatus, setLocalStatus] = useState(status)
  const [localPaid, setLocalPaid] = useState(paidAmount > 0 ? String(paidAmount) : '')
  const [isPending, startTransition] = useTransition()

  function save(nextStatus: string, paid?: string) {
    const formData = new FormData()
    formData.set('milestone_id', id)
    formData.set('status', nextStatus)
    if (nextStatus === 'partial') formData.set('paid_amount', paid ?? localPaid)
    startTransition(() => {
      setMilestoneStatus(formData)
    })
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setLocalStatus(next)
    if (next !== 'partial') save(next)
    // 'partial' ממתין ללחיצה על "שמור" אחרי שהוקלד סכום
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={localStatus}
        disabled={isPending}
        onChange={handleSelectChange}
        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${PAYMENT_STATUS_COLORS[localStatus] ?? ''}`}
      >
        {Object.entries(PAYMENT_STATUS_LABELS).map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
      {localStatus === 'partial' && (
        <span className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={amount}
            value={localPaid}
            disabled={isPending}
            onChange={(e) => setLocalPaid(e.target.value)}
            placeholder="סכום ששולם"
            className="w-20 border rounded px-1.5 py-1 text-xs"
          />
          <button
            type="button"
            disabled={isPending || !localPaid}
            onClick={() => save('partial')}
            className="text-xs text-blue-600 hover:underline disabled:opacity-40"
          >
            שמור
          </button>
        </span>
      )}
    </div>
  )
}
