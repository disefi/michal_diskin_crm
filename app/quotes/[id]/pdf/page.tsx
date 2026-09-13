import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QuoteDocument from '@/components/QuoteDocument'
import { DEFAULT_TERMS_TEXT } from '@/lib/constants'

export default async function QuotePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select(
      'id, quote_number, recipient_name, subtotal, discount, terms_text, show_payment_calculation, show_items_total, project_id, projects(title, case_number, description, clients(name))'
    )
    .eq('id', id)
    .maybeSingle()

  if (!quote) notFound()

  const { data: itemsData, error: itemsError } = await supabase
    .from('quote_items')
    .select('description, unit_price')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })
  if (itemsError) console.error('pdf page: quote_items fetch error:', itemsError)

  const { data: scopeItemsData, error: scopeItemsError } = await supabase
    .from('quote_scope_items')
    .select('description')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })
  if (scopeItemsError) console.error('pdf page: quote_scope_items fetch error:', scopeItemsError)

  const { data: paymentTermsData, error: paymentTermsError } = await supabase
    .from('quote_payment_terms')
    .select('percentage, description')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true })
  if (paymentTermsError) console.error('pdf page: quote_payment_terms fetch error:', paymentTermsError)

  const { data: profile } = await supabase
    .from('business_profile')
    .select('business_name, subtitle, email, phone1, phone2, business_number, logo_url, signature_url')
    .eq('id', true)
    .maybeSingle()

  const project = quote.projects as any
  const planLines: string[] = (project?.description ?? '').split('\n').map((l: string) => l.trim()).filter(Boolean)
  const effectiveTerms = (quote as any).terms_text ?? DEFAULT_TERMS_TEXT
  const termsLines: string[] = effectiveTerms.split('\n').map((l: string) => l.trim()).filter(Boolean)
  const preTaxTotal = Number(quote.subtotal) - Number(quote.discount)

  return (
    <QuoteDocument
      businessProfile={profile ?? null}
      caseNumber={project?.case_number ?? null}
      projectTitle={project?.title ?? ''}
      recipientName={(quote as any).recipient_name ?? project?.clients?.name ?? ''}
      planLines={planLines}
      scopeItems={(scopeItemsData ?? []).map((s) => s.description)}
      items={(itemsData ?? []).map((it) => ({ description: it.description, unit_price: Number(it.unit_price) }))}
      showItemsTotal={(quote as any).show_items_total}
      preTaxTotal={preTaxTotal}
      paymentTerms={paymentTermsData ?? []}
      showPaymentCalculation={(quote as any).show_payment_calculation}
      termsLines={termsLines}
      dateStr={new Date().toLocaleDateString('he-IL')}
      fitToPage
    />
  )
}
