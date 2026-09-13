import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { createClient } from '@/lib/supabase/server'

/**
 * מייצר PDF אוטומטית מעמוד ה-print (app/quotes/[id]/pdf) על ידי פתיחתו בדפדפן
 * "בלתי נראה" (Puppeteer) בצד השרת, כדי לקבל בדיוק את אותו עיצוב עם תמיכה מלאה בעברית/RTL.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // מעביר את עוגיות ההתחברות של המשתמש ל-Puppeteer, כדי שהעמוד המוגן יטען כמו בדפדפן הרגיל
  const cookieHeader = request.headers.get('cookie') ?? ''
  const origin = request.nextUrl.origin
  const targetUrl = `${origin}/quotes/${id}/pdf`

  // שם קובץ קריא: כתובת התיק + מספר תיק (עם עברית - מקודד לפי RFC 5987)
  const supabase = await createClient()
  const { data: quote } = await supabase
    .from('quotes')
    .select('projects(title, case_number)')
    .eq('id', id)
    .maybeSingle()
  const project = (quote as any)?.projects
  const rawName = [project?.title, project?.case_number].filter(Boolean).join(' - ') || `quote-${id}`
  const safeName = rawName.replace(/["/\\:*?<>|]/g, '').trim()
  const asciiFallback = 'quote.pdf'
  const encodedName = encodeURIComponent(`${safeName}.pdf`)

  let browser
  try {
    try {
      // עדיפות ראשונה: להשתמש ב-Chrome המותקן במחשב (עוקף בעיית תאימות ידועה
      // בכרום המצורף ל-Puppeteer בחלק ממכונות Windows)
      browser = await puppeteer.launch({
        headless: true,
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    } catch (channelError) {
      console.error('puppeteer launch via system chrome failed, falling back to bundled chromium:', channelError)
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    }
    const page = await browser.newPage()
    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader })
    }
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', right: '0mm', left: '0mm' },
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`,
      },
    })
  } catch (error) {
    // מדפיס את הודעת השגיאה המלאה + stack כדי שאפשר יהיה לאבחן מה בדיוק נכשל אצל Puppeteer
    console.error('quote pdf generation error:', error instanceof Error ? error.message : error)
    if (error instanceof Error && error.stack) console.error(error.stack)
    return NextResponse.json(
      { error: 'שגיאה ביצירת ה-PDF', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close()
  }
}
