'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type BusinessProfileInfo = {
  business_name: string | null
  subtitle: string | null
  email: string | null
  phone1: string | null
  phone2: string | null
  business_number: string | null
  logo_url: string | null
  signature_url: string | null
}

export type QuoteDocumentItem = { description: string; unit_price: number }

const BRAND_COLOR = '#c2703d'
// גובה עמוד A4 בפיקסלים ב-96dpi (297mm), בהתאמה ל-@page { size: A4; margin: 0 }
const A4_HEIGHT_PX = 1122

function WhatsAppIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#25D366" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 5 }}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.87 9.87 0 0 0 4.62 1.18h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09 1-2.37.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.28-.12.55.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.61-.07.16-.19.68-.79.86-1.06.18-.28.36-.23.61-.14.24.09 1.55.73 1.82.87.26.14.44.2.5.32.06.12.06.68-.19 1.36Z" />
    </svg>
  )
}

/**
 * מסמך ההצעה עצמו - קומפוננטה טהורה (רק תצוגה, בלי fetch), משמשת גם בעמוד ה-PDF
 * וגם בתצוגה המקדימה החיה בטופס העריכה, כדי שהם תמיד יהיו זהים בדיוק.
 *
 * שני חלקים נפרדים ולא קשורים זה לזה:
 * 1. "שורות תמחור" (items / quote_items) - שורה אחת -> תיבת "סה"כ לתשלום" צבעונית
 *    בודדת. 2+ שורות -> כותרת "סה"כ לתשלום:" ואז כל שורה מוצגת גם היא בתיבה
 *    צבעונית (תיאור + מחיר), ובנוסף - אם showItemsTotal מסומן - תיבת סיכום
 *    צבעונית נוספת בתחתית עם הסכום הכולל.
 * 2. "אופן תשלום" (paymentTerms / quote_payment_terms, אחוזים) - תמיד מוצג
 *    האחוז + התיאור. אם showPaymentCalculation מסומן, מתווסף בסוגריים גם
 *    הסכום המחושב - מיד אחרי האחוז, לפני התיאור.
 *
 * fitToPage: כשמסומן (true), הקומפוננטה מודדת את עצמה אחרי הרינדור ומכווצת/
 * מגדילה את עצמה (על ידי מכפיל scale פנימי נוסף) כך שההצעה תמלא בדיוק גובה
 * עמוד A4 - בלי רווח ריק בתחתית ובלי גלישה לעמוד שני. מיועד לשימוש בעמוד ה-PDF
 * בלבד; בתצוגה המקדימה בטופס משאירים false (ברירת מחדל) כי שם זה סתם פאנל גלילה.
 * מסמנת data-fit-ready="true" על האלמנט החיצוני בסיום ההתאמה, כדי שסקריפט
 * ה-PDF (Puppeteer) יוכל להמתין לה לפני צילום העמוד.
 */
export default function QuoteDocument({
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
  dateStr,
  scale = 1,
  fitToPage = false,
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
  dateStr: string
  scale?: number
  fitToPage?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const passRef = useRef(0)
  const [autoFit, setAutoFit] = useState(1)
  const [fitReady, setFitReady] = useState(!fitToPage)

  // "טביעת אצבע" של כל מה שמשפיע על הגובה - כדי לאפס ולחשב מחדש כל פעם שהתוכן משתנה
  const contentSignature = JSON.stringify({
    projectTitle,
    recipientName,
    planLines,
    scopeItems,
    items,
    showItemsTotal,
    preTaxTotal,
    paymentTerms,
    showPaymentCalculation,
    termsLines,
  })

  useEffect(() => {
    if (!fitToPage) return
    passRef.current = 0
    setAutoFit(1)
    setFitReady(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToPage, contentSignature])

  useLayoutEffect(() => {
    if (!fitToPage || fitReady) return
    const el = containerRef.current
    if (!el) return
    const measured = el.scrollHeight
    if (measured === 0) return
    const ratio = A4_HEIGHT_PX / measured
    const next = Math.min(Math.max(autoFit * ratio, 0.55), 1.6)
    passRef.current += 1
    setAutoFit(next)
    if (passRef.current >= 3 || Math.abs(next - autoFit) < 0.01) {
      setFitReady(true)
    }
  })

  const s = (n: number) => n * scale * autoFit

  const totalBoxStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fdf6f0',
    borderRight: `3px solid ${BRAND_COLOR}`,
    padding: `${s(10)}px ${s(16)}px`,
    borderRadius: 6,
  }

  return (
    <div
      ref={containerRef}
      data-fit-ready={fitReady ? 'true' : 'false'}
      style={{ fontFamily: 'var(--font-rubik), Arial, sans-serif', color: '#1f2937', maxWidth: 720, margin: '0 auto', padding: `${s(20)}px ${s(36)}px`, fontSize: s(15), lineHeight: 1.5, boxSizing: 'border-box' }}
    >
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
        }
        .quote-pdf, .quote-pdf * { box-sizing: border-box; }
        .quote-pdf .divider { border-top: 1px solid #e5e7eb; margin: ${s(12)}px 0; }
        .quote-pdf .bullet { display: flex; gap: 6px; margin: ${s(3)}px 0; line-height: 1.45; }
        .quote-pdf .bullet::before { content: '•'; color: ${BRAND_COLOR}; font-weight: 700; }
        .quote-pdf .section-label { font-weight: 700; color: ${BRAND_COLOR}; margin-bottom: ${s(4)}px; font-size: ${s(14.5)}px; }
      `}</style>
      <div className="quote-pdf">
        <div style={{ textAlign: 'center', marginBottom: s(4) }}>
          {businessProfile?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={businessProfile.logo_url} alt="לוגו" style={{ height: s(173), margin: '0 auto 6px', display: 'block' }} />
          )}
          <div style={{ fontSize: s(21), fontWeight: 700, color: BRAND_COLOR }}>{businessProfile?.business_name ?? ''}</div>
          <div style={{ fontSize: s(13), color: '#6b7280' }}>{businessProfile?.subtitle ?? ''}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap', gap: 10, fontSize: s(15), color: '#4b5563', marginTop: s(8) }}>
          {businessProfile?.email && <span>✉ {businessProfile.email}</span>}
          {businessProfile?.phone1 && <span>📞 {businessProfile.phone1}</span>}
          {businessProfile?.phone2 && (
            <span>
              <WhatsAppIcon /> {businessProfile.phone2}
            </span>
          )}
        </div>

        <div className="divider" style={{ borderTop: `2px solid ${BRAND_COLOR}`, opacity: 0.5 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: s(11), fontWeight: 700, marginBottom: s(10) }}>
          <span>מס&apos; תיק: {caseNumber ?? '—'}</span>
          <span>תאריך: {dateStr}</span>
        </div>

        <h1 style={{ textAlign: 'center', fontSize: s(21), fontWeight: 700, margin: `${s(4)}px 0` }}>הצעת מחיר לייעוץ מיגון</h1>
        <h2 style={{ textAlign: 'center', fontSize: s(18), fontWeight: 700, color: BRAND_COLOR, margin: `${s(2)}px 0 ${s(16)}px` }}>
          {projectTitle}
        </h2>

        <div className="section-label">לכבוד:</div>
        <div style={{ marginBottom: s(12) }}>{recipientName}</div>

        {planLines.length > 0 && (
          <>
            <div className="section-label">תוכניות כוללות:</div>
            {planLines.map((line, i) => (
              <div key={i} className="bullet">{line}</div>
            ))}
            <div style={{ height: s(8) }} />
          </>
        )}

        {scopeItems.length > 0 && (
          <>
            <div className="section-label">העבודה תכלול:</div>
            {scopeItems.map((it, i) => (
              <div key={i} className="bullet">{it}</div>
            ))}
            <div style={{ height: s(10) }} />
          </>
        )}

        {/* חלק 1: שורות תמחור - כל השורות (כולל סה"כ בודד וגם כל שורה כשיש כמה) בתיבה צבעונית */}
        {items.length <= 1 ? (
          <div style={{ ...totalBoxStyle, margin: `${s(12)}px 0` }}>
            <span style={{ fontWeight: 700 }}>סה&quot;כ לתשלום</span>
            <span style={{ fontWeight: 700, fontSize: s(16) }}>₪{preTaxTotal.toLocaleString()}</span>
          </div>
        ) : (
          <div style={{ margin: `${s(12)}px 0` }}>
            <div className="section-label">סה&quot;כ לתשלום:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(6) }}>
              {items.map((it, i) => (
                <div key={i} style={totalBoxStyle}>
                  <span style={{ fontWeight: 600 }}>{it.description}</span>
                  <span style={{ fontWeight: 700 }}>₪{it.unit_price.toLocaleString()}</span>
                </div>
              ))}
              {showItemsTotal && (
                <div style={totalBoxStyle}>
                  <span style={{ fontWeight: 700 }}>סה&quot;כ</span>
                  <span style={{ fontWeight: 700, fontSize: s(16) }}>₪{preTaxTotal.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* חלק 2: אופן תשלום (אחוזים) - הסכום, אם מסומן, מופיע בסוגריים מיד אחרי האחוז ולפני התיאור */}
        {paymentTerms.length >= 2 && (
          <>
            <div className="section-label">אופן תשלום:</div>
            {paymentTerms.map((t, i) => (
              <div key={i} className="bullet">
                {t.percentage}%{showPaymentCalculation ? ` (₪${Math.round((t.percentage / 100) * preTaxTotal).toLocaleString()})` : ''} {t.description}
              </div>
            ))}
            <div style={{ height: s(10) }} />
          </>
        )}

        {termsLines.length > 0 && (
          <div style={{ fontSize: s(10), color: '#9ca3af', marginTop: s(10) }}>
            {termsLines.map((line, i) => (
              <div key={i} className="bullet">{line}</div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: s(32) }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #9ca3af', width: s(160), marginBottom: 4 }} />
            <div style={{ fontSize: s(11), color: '#6b7280' }}>חתימת המזמין</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div>בברכה,</div>
            <div style={{ fontWeight: 700 }}>{businessProfile?.business_name ?? ''}</div>
            {businessProfile?.business_number && <div style={{ fontSize: s(11) }}>ע.מ. {businessProfile.business_number}</div>}
            {businessProfile?.signature_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessProfile.signature_url} alt="חתימה" style={{ height: s(48), marginTop: 4 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
