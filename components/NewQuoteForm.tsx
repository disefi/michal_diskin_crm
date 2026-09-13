'use client'
import { useState } from 'react'
import { createQuoteWithProject, addQuoteToProject } from '@/app/quotes/actions'
import QuoteItemsForm, { QuoteItemInput } from './QuoteItemsForm'
import ScopeItemsForm from './ScopeItemsForm'
import PaymentTermsForm, { PaymentTermInput } from './PaymentTermsForm'
import ClientQuickAddModal from './ClientQuickAddModal'
import QuoteLivePreviewPanel from './QuoteLivePreviewPanel'
import { BusinessProfileInfo } from './QuoteDocument'
import { DEFAULT_SCOPE_ITEMS, ProjectStatus } from '@/lib/constants'

type ExistingProject = { id: string; title: string; client: string; case_number: string | null }

export default function NewQuoteForm({
  clients: initialClients,
  existingProject,
  businessProfile,
  defaultTermsText,
  statuses,
}: {
  clients: { id: string; name: string }[]
  existingProject: ExistingProject | null
  businessProfile: BusinessProfileInfo | null
  defaultTermsText: string
  statuses: ProjectStatus[]
}) {
  const [clients, setClients] = useState(initialClients)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [recipientName, setRecipientName] = useState(existingProject?.client ?? '')
  const [recipientTouched, setRecipientTouched] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [city, setCity] = useState('')
  const [addressNote, setAddressNote] = useState('')
  const [description, setDescription] = useState('')
  const [scopeItemsLive, setScopeItemsLive] = useState<string[]>(DEFAULT_SCOPE_ITEMS)
  const [itemsLive, setItemsLive] = useState<QuoteItemInput[]>([])
  const [showItemsTotalLive, setShowItemsTotalLive] = useState(false)
  const [paymentTermsLive, setPaymentTermsLive] = useState<PaymentTermInput[]>([])
  const [showPaymentCalculationLive, setShowPaymentCalculationLive] = useState(false)
  const [preTaxTotalLive, setPreTaxTotalLive] = useState(0)
  const [termsTextLive, setTermsTextLive] = useState(defaultTermsText)
  const [includesConstruction, setIncludesConstruction] = useState(false)

  function handleClientChange(id: string) {
    setSelectedClientId(id)
    if (!recipientTouched) {
      const client = clients.find((c) => c.id === id)
      setRecipientName(client?.name ?? '')
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSubmitting(true)
    const action = existingProject ? addQuoteToProject : createQuoteWithProject
    const result = await action(formData)
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  const liveProjectTitle = existingProject
    ? existingProject.title
    : [[street, houseNumber].filter(Boolean).join(' '), city].filter(Boolean).join(', ') + (addressNote ? ` - ${addressNote}` : '')

  const liveCaseNumber = existingProject?.case_number ?? null
  const livePlanLines = (existingProject ? '' : description).split('\n').map((l) => l.trim()).filter(Boolean)
  const liveTermsLines = termsTextLive.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
        <form action={handleSubmit} className="space-y-6">
          {existingProject ? (
            <div className="bg-white rounded-lg shadow p-4">
              <input type="hidden" name="project_id" value={existingProject.id} />
              <p className="text-sm text-gray-500">הצעה חדשה עבור תיק קיים</p>
              <p className="font-medium">{existingProject.title} · {existingProject.client}</p>
              <p className="text-xs text-gray-400 font-mono">תיק מס&apos; {existingProject.case_number ?? '—'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h2 className="font-semibold">פרטי תיק חדש</h2>

              <div>
                <label className="text-xs text-gray-500 block mb-1">לקוח *</label>
                <div className="flex gap-2">
                  <select
                    name="client_id"
                    required
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="flex-1 border rounded px-2 py-1.5 text-sm"
                  >
                    <option value="">בחר/י לקוח...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewClient(true)}
                    className="text-sm text-gray-600 hover:underline whitespace-nowrap"
                  >
                    + לקוח חדש
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">רחוב *</label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">מספר</label>
                  <input
                    type="text"
                    name="house_number"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="למשל 12 או 12-14"
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">עיר *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  כותרת נוספת (רשות - להבדיל בין שני תיקים באותה כתובת, למשל &quot;תכנית שינויים&quot;)
                </label>
                <input
                  type="text"
                  name="address_note"
                  value={addressNote}
                  onChange={(e) => setAddressNote(e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">איש קשר נוסף / משרד מלווה (רשות)</label>
                <input type="text" name="additional_contact" className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <label className="text-xs text-gray-500 block mb-1">לכבוד (ברירת מחדל: שם הלקוח, ניתן לשינוי)</label>
            <input
              type="text"
              name="recipient_name"
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value)
                setRecipientTouched(true)
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>

          {!existingProject && (
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <label className="text-xs text-gray-500 block mb-1">תוכניות כוללות (מוצג בהצעה ללקוח)</label>
              <textarea
                name="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
          )}

          <ScopeItemsForm includeConstruction={includesConstruction} onChange={setScopeItemsLive} />

          <QuoteItemsForm
            onPreTaxTotalChange={setPreTaxTotalLive}
            onItemsChange={setItemsLive}
            onShowItemsTotalChange={setShowItemsTotalLive}
          />

          <PaymentTermsForm
            statuses={statuses}
            onChange={setPaymentTermsLive}
            onShowCalculationChange={setShowPaymentCalculationLive}
          />

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <label className="text-xs text-gray-500 block mb-1">תנאים כלליים להצעה זו</label>
            <textarea
              name="terms_text"
              rows={3}
              value={termsTextLive}
              onChange={(e) => setTermsTextLive(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="font-semibold text-sm text-gray-500">פרטים פנימיים (לא מוצגים בהצעה)</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">הערות</label>
              <textarea name="notes" rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
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

          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? 'שומר...' : 'שמירת הצעת מחיר'}
            </button>
          </div>
        </form>

        <QuoteLivePreviewPanel
          businessProfile={businessProfile}
          caseNumber={liveCaseNumber}
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

      {showNewClient && (
        <ClientQuickAddModal
          onCreated={(client) => {
            setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name, 'he')))
            setSelectedClientId(client.id)
            if (!recipientTouched) setRecipientName(client.name)
            setShowNewClient(false)
          }}
          onClose={() => setShowNewClient(false)}
        />
      )}
    </>
  )
}
