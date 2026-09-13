'use client'
import { useEffect, useState } from 'react'
import NumberInput from './NumberInput'
import { ProjectStatus } from '@/lib/constants'

export type PaymentTermInput = {
  percentage: number
  description: string
  trigger_status_id: string | null
}

/**
 * רשימת "אופן תשלום" - אחוז + תנאי + תגית סטטוס פנימית לכל שלב. בעת אישור
 * ההצעה, כל שורה כאן הופכת אוטומטית לשלב גבייה (payment_milestone) עם הסכום
 * המתאים והתגית מועתקת אליו.
 * בהצעה עצמה תמיד מוצג האחוז + התיאור. תיבת "הצג חישוב סכומים" מוסיפה בסוגריים
 * גם את הסכום המחושב לצד האחוז - היא לא מחליפה אותו.
 */
export default function PaymentTermsForm({
  initialTerms,
  initialShowCalculation,
  statuses,
  onChange,
  onShowCalculationChange,
}: {
  initialTerms?: PaymentTermInput[]
  initialShowCalculation?: boolean
  statuses: ProjectStatus[]
  onChange?: (terms: PaymentTermInput[]) => void
  onShowCalculationChange?: (value: boolean) => void
}) {
  const [terms, setTerms] = useState<PaymentTermInput[]>(
    initialTerms && initialTerms.length > 0
      ? initialTerms
      : [
          { percentage: 20, description: '', trigger_status_id: null },
          { percentage: 80, description: '', trigger_status_id: null },
        ]
  )
  const [showCalculation, setShowCalculation] = useState(initialShowCalculation ?? false)

  const activeStatuses = [...statuses]
    .filter((s) => s.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)

  useEffect(() => {
    onChange?.(terms)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms])

  useEffect(() => {
    onShowCalculationChange?.(showCalculation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalculation])

  function updateTerm(index: number, field: keyof PaymentTermInput, value: string | number | null) {
    setTerms((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  function addRow() {
    setTerms((prev) => [...prev, { percentage: 0, description: '', trigger_status_id: null }])
  }

  function removeRow(index: number) {
    setTerms((prev) => prev.filter((_, i) => i !== index))
  }

  const totalPercent = terms.reduce((sum, t) => sum + (Number(t.percentage) || 0), 0)

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <input type="hidden" name="payment_terms_json" value={JSON.stringify(terms)} />
      <input type="hidden" name="show_payment_calculation" value={showCalculation ? 'true' : 'false'} />
      <h2 className="font-semibold">אופן תשלום</h2>
      <div className="space-y-2">
        {terms.map((term, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center">
            <NumberInput
              value={term.percentage}
              onChange={(e) => updateTerm(i, 'percentage', parseFloat(e.target.value) || 0)}
              className="w-20 border rounded px-2 py-1.5 text-sm"
              min={0}
              max={100}
            />
            <span className="text-sm text-gray-500">%</span>
            <input
              type="text"
              value={term.description}
              onChange={(e) => updateTerm(i, 'description', e.target.value)}
              placeholder="לדוגמה: לאחר שליחת הנחיות"
              className="flex-1 min-w-[140px] border rounded px-2 py-1.5 text-sm"
            />
            <select
              value={term.trigger_status_id ?? ''}
              onChange={(e) => updateTerm(i, 'trigger_status_id', e.target.value || null)}
              title="תגית פנימית - כשהתיק יגיע לסטטוס הזה, השלב יעבור אוטומטית לגבייה. לא מוצג ללקוח."
              className="border rounded px-2 py-1.5 text-xs text-gray-600 max-w-[160px]"
            >
              <option value="">— ללא תגית —</option>
              {activeStatuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:scale-110 transition">
              🗑️
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="text-sm text-gray-600 hover:underline">
        + הוספת שלב תשלום
      </button>
      <p className="text-xs text-gray-400">
        התגית ליד כל שורה פנימית בלבד - לא מוצגת בהצעה ללקוח. כשהתיק מגיע לסטטוס שבחרת, השלב הזה יעבור אוטומטית לגבייה.
      </p>
      {totalPercent !== 100 && (
        <p className="text-xs text-orange-600">סך האחוזים כרגע {totalPercent}% (לא 100%)</p>
      )}
      {terms.length >= 2 && (
        <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t">
          <input
            type="checkbox"
            checked={showCalculation}
            onChange={(e) => setShowCalculation(e.target.checked)}
            className="w-4 h-4"
          />
          הצג בסוגריים גם את הסכום המחושב לכל שלב (בנוסף לאחוז)
        </label>
      )}
    </div>
  )
}
