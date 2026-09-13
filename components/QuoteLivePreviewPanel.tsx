'use client'
import { useState } from 'react'
import QuoteDocument, { BusinessProfileInfo, QuoteDocumentItem } from './QuoteDocument'
/**
 * פאנל תצוגה מקדימה חיה - מוצג לצד הטופס (במסכים רחבים) ומתעדכן מיידית
 * עם כל שינוי, כי הוא מקבל את כל הערכים כ-props ממצב הטופס עצמו (לא שולף מה-DB).
 * במסכים צרים מוסתר מאחורי כפתור, כדי לא לתפוס מקום.
 */
export default function QuoteLivePreviewPanel({
  businessProfile,
  caseNumber,
  projectTitle,
  recipientName,
  planLines,
  scopeItems,
  items = [],
  showItemsTotal,
  preTaxTotal,
  paymentTerms,
  showPaymentCalculation,
  termsLines,
}: {
  businessProfile: BusinessProfileInfo | null
  caseNumber: string | null
  projectTitle: string
  recipientName: string
  planLines: string[]
  scopeItems: string[]
  items: QuoteDocumentItem[]
  showItemsTotal?: boolean
  preTaxTotal: number
  paymentTerms: { percentage: number; description: string }[]
  showPaymentCalculation?: boolean
  termsLines: string[]
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const document = (
    <div className="bg-white rounded-lg shadow border overflow-y-auto max-h-[85vh]">
      <QuoteDocument
        businessProfile={businessProfile}
        caseNumber={caseNumber}
        projectTitle={projectTitle || 'כותרת התיק תופיע כאן'}
        recipientName={recipientName || 'שם הלקוח'}
        planLines={planLines}
        scopeItems={scopeItems}
        items={items}
        showItemsTotal={showItemsTotal}
        preTaxTotal={preTaxTotal}
        paymentTerms={paymentTerms}
        showPaymentCalculation={showPaymentCalculation}
        termsLines={termsLines}
        dateStr={new Date().toLocaleDateString('he-IL')}
        scale={0.75}
      />
    </div>
  )
  return (
    <>
      {/* מסכים רחבים: פאנל דביק לצד הטופס */}
      <div className="hidden lg:block sticky top-4 self-start">
        <p className="text-xs text-gray-400 mb-2 text-center">תצוגה מקדימה חיה</p>
        {document}
      </div>
      {/* מסכים צרים: כפתור מקפיץ */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="w-full text-sm text-gray-600 border rounded-lg py-2 hover:bg-gray-50"
        >
          👁️ תצוגה מקדימה חיה
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={() => setMobileOpen(false)}>
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end p-2">
                <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl px-2">×</button>
              </div>
              <QuoteDocument
                businessProfile={businessProfile}
                caseNumber={caseNumber}
                projectTitle={projectTitle || 'כותרת התיק תופיע כאן'}
                recipientName={recipientName || 'שם הלקוח'}
                planLines={planLines}
                scopeItems={scopeItems}
                items={items}
                showItemsTotal={showItemsTotal}
                preTaxTotal={preTaxTotal}
                paymentTerms={paymentTerms}
                showPaymentCalculation={showPaymentCalculation}
                termsLines={termsLines}
                dateStr={new Date().toLocaleDateString('he-IL')}
                scale={0.85}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
