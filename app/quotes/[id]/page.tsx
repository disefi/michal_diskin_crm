import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import QuoteDetail from '@/components/QuoteDetail'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectStatus } from '@/lib/constants'

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ warning?: string }>
}) {
  const { id } = await params
  const { warning } = await searchParams
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select(
      'id, quote_number, status, notes, recipient_name, subtotal, discount, tax_rate, total, terms_text, includes_construction, show_payment_calculation, show_items_total, archived_at, project_id, projects(id, title, description, case_number, street, house_number, city, address_note, additional_contact, clients(name))'
    )
    .eq('id', id)
    .maybeSingle()

  if (!quote) notFound()

  const { data: businessProfileData } = await supabase
    .from('business_profile')
    .select('business_name, subtitle, email, phone1, phone2, business_number, logo_url, signature_url')
    .eq('id', true)
    .maybeSingle()

  const { data: statusesData } = await supabase
    .from('project_statuses')
    .select('id, label, color, sort_order, is_active, visible_in, stale_after_days')
    .order('sort_order', { ascending: true })
  const statuses = (statusesData ?? []) as ProjectStatus[]

  const { data: itemsData } = await supabase
    .from('quote_items')
    .select('id, description, unit_price, sort_order')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  const { data: scopeItemsData } = await supabase
    .from('quote_scope_items')
    .select('description, sort_order')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  const { data: paymentTermsData } = await supabase
    .from('quote_payment_terms')
    .select('percentage, description, trigger_status_id, sort_order')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })

  return (
    <AppShell>
      <Link href="/quotes" className="text-sm text-gray-500 hover:underline">← חזרה להצעות מחיר</Link>
      <div className="mt-4">
        <QuoteDetail
          quote={{
            id: quote.id,
            quote_number: quote.quote_number,
            status: quote.status,
            notes: quote.notes,
            recipient_name: (quote as any).recipient_name,
            discount: quote.discount,
            tax_rate: quote.tax_rate,
            terms_text: (quote as any).terms_text,
            includes_construction: (quote as any).includes_construction,
            show_payment_calculation: (quote as any).show_payment_calculation,
            show_items_total: (quote as any).show_items_total,
            archived_at: (quote as any).archived_at,
            project_id: quote.project_id,
            project_title: (quote as any).projects?.title ?? '-',
            project_description: (quote as any).projects?.description ?? null,
            case_number: (quote as any).projects?.case_number ?? null,
            client: (quote as any).projects?.clients?.name ?? '-',
            street: (quote as any).projects?.street ?? null,
            house_number: (quote as any).projects?.house_number ?? null,
            city: (quote as any).projects?.city ?? null,
            address_note: (quote as any).projects?.address_note ?? null,
            additional_contact: (quote as any).projects?.additional_contact ?? null,
          }}
          items={(itemsData ?? []).map((it) => ({
            description: it.description,
            unit_price: it.unit_price,
          }))}
          scopeItems={(scopeItemsData ?? []).map((s) => s.description)}
          paymentTerms={(paymentTermsData ?? []).map((t) => ({
            percentage: t.percentage,
            description: t.description,
            trigger_status_id: t.trigger_status_id ?? null,
          }))}
          businessProfile={businessProfileData ?? null}
          statuses={statuses}
          initialWarning={warning ?? null}
        />
      </div>
    </AppShell>
  )
}
