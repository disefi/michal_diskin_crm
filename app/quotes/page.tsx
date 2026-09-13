import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import QuotesTable, { QuoteRow } from '@/components/QuotesTable'
import Link from 'next/link'

export default async function QuotesPage() {
  const supabase = await createClient()

  // הצעות שעברו X חודשים (נקבע ב-/settings) עוברות אוטומטית לארכיון, אלא אם הוצאו ממנו ידנית (keep_active)
  const { data: archiveSetting } = await supabase
    .from('quote_archive_settings')
    .select('months')
    .eq('id', true)
    .maybeSingle()
  const archiveMonths = archiveSetting?.months ?? 12

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - archiveMonths)

  const { error: sweepError } = await supabase
    .from('quotes')
    .update({ archived_at: new Date().toISOString() })
    .is('archived_at', null)
    .eq('keep_active', false)
    .lt('created_at', cutoffDate.toISOString())
  if (sweepError) console.error('quotes auto-archive sweep error:', sweepError)

  const { data } = await supabase
    .from('quotes')
    .select('id, quote_number, status, total, subtotal, discount, created_at, projects(id, title, case_number, clients(name))')
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  const quotes: QuoteRow[] = (data ?? []).map((q: any) => ({
    id: q.id,
    quote_number: q.quote_number,
    status: q.status,
    total: q.total,
    subtotal: q.subtotal,
    discount: q.discount,
    created_at: q.created_at,
    project_id: q.projects?.id ?? '',
    project_title: q.projects?.title ?? '-',
    case_number: q.projects?.case_number ?? null,
    client: q.projects?.clients?.name ?? '-',
  }))

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">הצעות מחיר</h1>
        <Link href="/quotes/new" className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700">
          + הצעת מחיר חדשה
        </Link>
      </div>
      <QuotesTable quotes={quotes} />
    </AppShell>
  )
}
