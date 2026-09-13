'use client'
import { useEffect, useRef, useState } from 'react'
import { DEFAULT_SCOPE_ITEMS, CONSTRUCTION_LINE } from '@/lib/constants'

/**
 * רשימת בולטים "העבודה תכלול" - זו הרשימה שמוצגת ללקוח בהצעת המחיר בפועל,
 * נפרדת משורות התמחור הפנימיות. מתחילה מברירת מחדל קבועה, ניתנת לעריכה מלאה.
 * תיבת הסימון "כולל קונסטרוקציה" מוסיפה/מסירה את שורת הקונסטרוקציה בלחיצה,
 * אבל תמיד אפשר גם להוסיף/למחוק אותה ידנית בעצמך.
 */
export default function ScopeItemsForm({
  initialItems,
  includeConstruction,
  onChange,
}: {
  initialItems?: string[]
  includeConstruction?: boolean
  onChange?: (items: string[]) => void
}) {
  const [items, setItems] = useState<string[]>(
    initialItems && initialItems.length > 0 ? initialItems : DEFAULT_SCOPE_ITEMS
  )
  const isFirstRender = useRef(true)

  useEffect(() => {
    onChange?.(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // מגיב רק לשינוי בפועל של תיבת הסימון (לא בטעינה הראשונית), כדי לא לגעת בנתונים קיימים בלי פעולה מפורשת
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (includeConstruction === undefined) return
    setItems((prev) => {
      const has = prev.includes(CONSTRUCTION_LINE)
      if (includeConstruction && !has) return [...prev, CONSTRUCTION_LINE]
      if (!includeConstruction && has) return prev.filter((it) => it !== CONSTRUCTION_LINE)
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeConstruction])

  function updateItem(index: number, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? value : it)))
  }

  function addRow() {
    setItems((prev) => [...prev, ''])
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      <input type="hidden" name="scope_items_json" value={JSON.stringify(items)} />
      <h2 className="font-semibold">העבודה תכלול (מוצג בהצעה ללקוח)</h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-gray-400">•</span>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 border rounded px-2 py-1.5 text-sm"
            />
            <button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:scale-110 transition">
              🗑️
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="text-sm text-gray-600 hover:underline">
        + הוספת שורה
      </button>
    </div>
  )
}
