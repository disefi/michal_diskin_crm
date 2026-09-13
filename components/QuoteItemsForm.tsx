'use client'
import { useEffect, useState } from 'react'
import NumberInput from './NumberInput'

export type QuoteItemInput = {
  description: string
  unit_price: number
}

/**
 * טופס שורות פריטים דינמי להצעת מחיר - תיאור + מחיר בלבד (בלי כמות/יחידה).
 * חישוב סכומים חי (סיכום ביניים, הנחה, מע"מ, סה"כ).
 *
 * תיבת הסימון "הצג שורת סיכום בהצעה" (show_items_total) קובעת האם - כשיש 2+
 * שורות - תופיע גם שורת סיכום מחוברת מתחת לרשימת השורות בהצעה עצמה (QuoteDocument).
 * ברירת מחדל: כבויה. כשיש שורה אחת בלבד זה לא רלוונטי - תמיד מוצג רק "סה"כ לתשלום".
 */
export default function QuoteItemsForm({
  initialItems,
  initialDiscount,
  initialTaxRate,
  initialShowItemsTotal,
  onPreTaxTotalChange,
  onItemsChange,
  onShowItemsTotalChange,
}: {
  initialItems?: QuoteItemInput[]
  initialDiscount?: number
  initialTaxRate?: number
  initialShowItemsTotal?: boolean
  onPreTaxTotalChange?: (preTaxTotal: number) => void
  onItemsChange?: (items: QuoteItemInput[]) => void
  onShowItemsTotalChange?: (value: boolean) => void
}) {
  const [items, setItems] = useState<QuoteItemInput[]>(
    initialItems && initialItems.length > 0 ? initialItems : [{ description: '', unit_price: 0 }]
  )
  const [discount, setDiscount] = useState(initialDiscount ?? 0)
  const [taxRate, setTaxRate] = useState(initialTaxRate ?? 18)
  const [showItemsTotal, setShowItemsTotal] = useState(initialShowItemsTotal ?? false)

  function updateItem(index: number, field: keyof QuoteItemInput, value: string | number) {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  function addRow() {
    setItems((prev) => [...prev, { description: '', unit_price: 0 }])
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.unit_price) || 0), 0)
  const afterDiscount = Math.max(subtotal - (Number(discount) || 0), 0)
  const taxAmount = afterDiscount * ((Number(taxRate) || 0) / 100)
  const total = afterDiscount + taxAmount

  useEffect(() => {
    onPreTaxTotalChange?.(afterDiscount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterDiscount])

  useEffect(() => {
    onItemsChange?.(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  useEffect(() => {
    onShowItemsTotalChange?.(showItemsTotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showItemsTotal])

  return (
    <div className="space-y-4">
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />
      <input type="hidden" name="subtotal" value={subtotal} />
      <input type="hidden" name="discount" value={discount} />
      <input type="hidden" name="tax_rate" value={taxRate} />
      <input type="hidden" name="total" value={total} />
      <input type="hidden" name="show_items_total" value={showItemsTotal ? 'true' : 'false'} />

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2">תיאור</th>
              <th className="p-2 w-32">מחיר</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  <input
                    type="text"
                    value={it.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="תיאור הפריט"
                  />
                </td>
                <td className="p-2">
                  <NumberInput
                    value={it.unit_price}
                    onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-2 py-1"
                    min={0}
                    step="0.01"
                  />
                </td>
                <td className="p-2">
                  <button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:scale-110 transition">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addRow} className="m-2 text-sm text-gray-600 hover:underline">
          + הוספת שורה
        </button>
      </div>

      {items.length >= 2 && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showItemsTotal}
            onChange={(e) => setShowItemsTotal(e.target.checked)}
            className="w-4 h-4"
          />
          הצג בהצעה גם שורת סיכום מחוברת מתחת לשורות (בנוסף לכל שורה בנפרד)
        </label>
      )}

      <div className="flex justify-end">
        <div className="w-72 space-y-2 bg-gray-50 rounded-lg p-4 text-sm">
          <div className="flex justify-between">
            <span>סיכום ביניים</span>
            <span>₪{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>הנחה (₪)</span>
            <NumberInput
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 border rounded px-2 py-1 text-left"
              min={0}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>מע&quot;מ (%)</span>
            <NumberInput
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-24 border rounded px-2 py-1 text-left"
              min={0}
            />
          </div>
          <div className="flex justify-between font-semibold border-t pt-2 text-base">
            <span>סה&quot;כ כולל מע&quot;מ</span>
            <span>
              ₪{total.toLocaleString()}{' '}
              <span className="text-xs text-gray-400 font-normal">(₪{afterDiscount.toLocaleString()} לפני מע&quot;מ)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
