'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { reviseQuote, setQuoteStatus, deleteQuote, unarchiveQuote } from '@/app/quotes/actions'
import { setProjectStatus } from '@/app/projects/actions'
import QuoteItemsForm, { QuoteItemInput } from './QuoteItemsForm'
import ScopeItemsForm from './ScopeItemsForm'
import PaymentTermsForm, { PaymentTermInput } from './PaymentTermsForm'
import QuoteLivePreviewPanel from './QuoteLivePreviewPanel'
import { BusinessProfileInfo } from './QuoteDocument'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, ProjectStatus } from '@/lib/constants'

type Quote = {
  id: string
  quote_number: string
  status: string
  notes: string | null
  recipient_name: string | null
  discount: number
  tax_rate: number
  terms_text: string | null
  includes_construction: boolean
  show_payment_calculation: boolean
  show_items_total: boolean
  archived_at: string | null
  project_id: string
  project_title: string
  project_description: string | null
  case_number: string | null
  client: string
  street: string | null
  house_number: string | null
  city: string | null
  address_note: string | null
  additional_contact: string | null
}

export default function QuoteDetail({
  quote,
  items,
  scopeItems,
  paymentTerms,
  businessProfile,
  statuses,
  initialWarning,
}: {
  quote: Quote
  items: QuoteItemInput[]
  scopeItems: string[]
  paymentTerms: PaymentTermInput[]
  businessProfile: BusinessProfileInfo | null
  statuses: ProjectStatus[]
  initialWarning?: string | null
}) {
  const [status, setStatus] = useState(quote.status)
  const [archivePrompt, setArchivePrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(initialWarning ?? null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [street, setStreet] = useState(quote.street ?? '')
  const [houseNumber, setHouseNumber] = useState(quote.house_number ?? '')
  const [city, setCity] = useState(quote.city ?? '')
  const [addressNote, setAddressNote] = useState(quote.address_note ?? '')
  const [description, setDescription] = useState(quote.project_description ?? '')
  const [recipientName, setRecipientName] = useState(quote.recipient_name ?? quote.client)
  const [termsTextLive, setTermsTextLive] = useState(quote.terms_text ?? '')
  const [scopeItemsLive, setScopeItemsLive] = useState<string[]>(scopeItems)
  const [itemsLive, setItemsLive] = useState<QuoteItemInput[]>(items)
  const [showItemsTotalLive, setShowItemsTotalLive] = useState(quote.show_items_total)
  const [paymentTermsLive, setPaymentTermsLive] = useState<PaymentTermInput[]>(paymentTerms)
  const [preTaxTotalLive, setPreTaxTotalLive] = useState(0)
  const [includesConstruction, setIncludesConstruction] = useState(quote.includes_construction)
  const [showPaymentCalculationLive, setShowPaymentCalculationLive] = useState(quote.show_payment_calculation)

  function handleStatusChange(newStatus: string) {
    setError(null)
    const formData = new FormData()
    formData.set('quote_id', quote.id)
    formData.set('status', newStatus)
    formData.set('project_id', quote.project_id)
    startTransition(async () => {
      const result = await setQuoteStatus(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setStatus(newStatus)
      if (result.rejected) setArchivePrompt(true)
    })
  }

  function handleArchiveProject(archive: boolean) {
    setArchivePrompt(false)
    if (!archive) return
    const formData = new FormData()
    formData.set('project_id', quote.project_id)
    // "ביטול" - לא סטטוס קבוע יותר, אלא הסטטוס הראשון המסומן לארכיון ברשימה הדינמית
    const cancelledStatus = statuses.find((s) => s.visible_in.includes('archive'))
    if (cancelledStatus) formData.set('status_id', cancelledStatus.id)
    startTransition(() => {
      setProjectStatus(formData)
    })
  }

  function handleUnarchive() {
    startTransition(() => {
      unarchiveQuote(quote.id, quote.project_id)
    })
  }

  function handleDelete() {
    if (!confirm(`למחוק את הצעת המחיר ${quote.quote_number}? פעולה זו לא ניתנת לביטול.`)) return
    startTransition(async () => {
      const result = await deleteQuote(quote.id, quote.project_id)
      if (result.error) setError(result.error)
      else router.push('/quotes')
    })
  }

  async function handleRevise(formData: FormData) {
    setError(null)
    const result = await reviseQuote(formData)
    if (result && result.error) setError(result.error)
  }

  const liveProjectTitle =
    [[street, houseNumber].filter(Boolean).join(' '), city].filter(Boolean).join(', ') + (addressNote ? ` - ${addressNote}` : '')
  const livePlanLines = description.split('\n').map((l) => l.trim()).filter(Boolean)
  const liveTermsLines = termsTextLive.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
              {quote.archived_at && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">גרסה בארכיון</span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              <Link href={`/projects/${quote.project_id}`} className="hover:underline">
                {quote.project_title}
              </Link>
              {' · '}{quote.client}{' · '}
              <span className="font-mono text-xs">תיק {quote.case_number ?? '—'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/quotes/${quote.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 border rounded-full px-3 py-1.5 hover:bg-gray-50"
            >
              👁️ תצוגה
            </a>
            <a
              href={`/api/quotes/${quote.id}/pdf`}
              className="text-xs text-gray-600 border rounded-full px-3 py-1.5 hover:bg-gray-50"
            >
              ⬇️ הורדת PDF
            </a>
            {quote.archived_at && (
              <button
                onClick={handleUnarchive}
                disabled={isPending}
                className="text-xs text-gray-600 border rounded-full px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                הוצא מארכיון
              </button>
            )}
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isPending}
              className={`text-xs px-3 py-1.5 rounded-full border-0 cursor-pointer disabled:opacity-50 ${QUOTE_STATUS_COLORS[status] ?? ''}`}
            >
              {Object.entries(QUOTE_STATUS_LABELS).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}
        {warning && (
          <div className="mt-4 p-3 bg-orange-50 text-orange-700 text-sm rounded border border-orange-200 flex justify-between items-start gap-2">
            <span>{warning}</span>
            <button onClick={() => setWarning(null)} className="text-orange-400 hover:text-orange-700 shrink-0">×</button>
          </div>
        )}

        {archivePrompt && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="mb-2">ההצעה סומנה כ&quot;נדחתה&quot;. להעביר גם את התיק לארכיון (ביטול)?</p>
            <div className="flex gap-2">
              <button onClick={() => handleArchiveProject(true)} className="px-3 py-1.5 bg-gray-800 text-white rounded text-xs">
                כן, העבר לארכיון
              </button>
              <button onClick={() => handleArchiveProject(false)} className="px-3 py-1.5 text-gray-600 text-xs">
                לא, אולי תישלח גרסה מתוקנת
              </button>
            </div>
          </div>
        )}

        <button onClick={handleDelete} disabled={isPending} className="text-sm text-red-600 hover:underline mt-4 disabled:opacity-40">
          🗑️ מחיקת הצעה
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        <form action={handleRevise} className="space-y-6">
          <input type="hidden" name="id" value={quote.id} />
          <input type="hidden" name="project_id" value={quote.project_id} />

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="font-semibold">פרטי התיק</h2>
            <p className="text-xs text-gray-400">
              שינוי כאן ושמירה ייצור גרסה חדשה של ההצעה, וההצעה הנוכחית תעבור אוטומטית לארכיון.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">רחוב *</label>
                <input type="text" name="street" required value={street} onChange={(e) => setStreet(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">מספר</label>
                <input type="text" name="house_number" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">עיר *</label>
              <input type="text" name="city" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">כותרת נוספת (רשות)</label>
              <input type="text" name="address_note" value={addressNote} onChange={(e) => setAddressNote(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">איש קשר נוסף / משרד מלווה (רשות)</label>
              <input type="text" name="additional_contact" defaultValue={quote.additional_contact ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <label className="text-xs text-gray-500 block mb-1">לכבוד</label>
            <input type="text" name="recipient_name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <label className="text-xs text-gray-500 block mb-1">תוכניות כוללות (מוצג בהצעה ללקוח)</label>
            <textarea name="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>

          <ScopeItemsForm initialItems={scopeItems} includeConstruction={includesConstruction} onChange={setScopeItemsLive} />

          <QuoteItemsForm
            initialItems={items}
            initialDiscount={quote.discount}
            initialTaxRate={quote.tax_rate}
            initialShowItemsTotal={quote.show_items_total}
            onPreTaxTotalChange={setPreTaxTotalLive}
            onItemsChange={setItemsLive}
            onShowItemsTotalChange={setShowItemsTotalLive}
          />

          <PaymentTermsForm
            initialTerms={paymentTerms}
            initialShowCalculation={quote.show_payment_calculation}
            statuses={statuses}
            onChange={setPaymentTermsLive}
            onShowCalculationChange={setShowPaymentCalculationLive}
          />

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <label className="text-xs text-gray-500 block mb-1">תנאים כלליים להצעה זו</label>
            <textarea name="terms_text" rows={3} value={termsTextLive} onChange={(e) => setTermsTextLive(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="font-semibold text-sm text-gray-500">פרטים פנימיים (לא מוצגים בהצעה)</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">הערות</label>
              <textarea name="notes" rows={2} defaultValue={quote.notes ?? ''} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="includes_construction"
                value="true"
                checked={includesConstruction}
                onChange={(e) => setIncludesConstruction(e.target.checked)}
                className="w-4 h-4"
              />
              כולל קונסטרוקציה
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
              שמירה כגרסה חדשה
            </button>
          </div>
        </form>

        <QuoteLivePreviewPanel
          businessProfile={businessProfile}
          caseNumber={quote.case_number}
          projectTitle={liveProjectTitle}
          recipientName={recipientName}
          planLines={livePlanLines}
          scopeItems={scopeItemsLive}
          items={itemsLive}
          showItemsTotal={showItemsTotalLive}
          preTaxTotal={preTaxTotalLive}
          paymentTerms={paymentTermsLive}
          showPaymentCalculation={showPaymentCalculationLive}
          termsLines={liveTermsLines}
        />
      </div>
    </div>
  )
}
