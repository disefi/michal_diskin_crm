'use client'
import { setQuoteStatus } from '@/app/quotes/actions'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/constants'

/** שינוי סטטוס הצעה ישירות מתוך שורת טבלה, בלי להיכנס לתוך ההצעה */
export default function InlineQuoteStatusSelect({
  quoteId,
  projectId,
  status,
}: {
  quoteId: string
  projectId: string
  status: string
}) {
  async function handleChange(formData: FormData) {
    await setQuoteStatus(formData)
  }

  return (
    <form action={handleChange} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="project_id" value={projectId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        onClick={(e) => e.stopPropagation()}
        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${QUOTE_STATUS_COLORS[status] ?? ''}`}
      >
        {Object.entries(QUOTE_STATUS_LABELS).map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
    </form>
  )
}
