'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSafeCreatedBy } from '@/lib/getSafeCreatedBy'
import { buildAddressAndTitle } from '@/lib/buildProjectAddress'

type QuoteItemInput = { description: string; unit_price: number }
type PaymentTermInput = { percentage: number; description: string; trigger_status_id: string | null }
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function parseItems(raw: string | null): QuoteItemInput[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((it) => it && String(it.description || '').trim() !== '')
      .map((it) => ({
        description: String(it.description),
        unit_price: Number(it.unit_price) || 0,
      }))
  } catch {
    return []
  }
}

function parseScopeItems(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((it) => String(it)).filter((it) => it.trim() !== '')
  } catch {
    return []
  }
}

function parsePaymentTerms(raw: string | null): PaymentTermInput[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((t) => t && Number(t.percentage) > 0)
      .map((t) => ({
        percentage: Number(t.percentage) || 0,
        description: String(t.description || ''),
        trigger_status_id: t.trigger_status_id ? String(t.trigger_status_id) : null,
      }))
  } catch {
    return []
  }
}

async function insertItems(supabase: SupabaseClient, quoteId: string, items: QuoteItemInput[]): Promise<string | null> {
  if (items.length === 0) return null
  const { error } = await supabase.from('quote_items').insert(
    items.map((it, i) => ({
      quote_id: quoteId,
      description: it.description,
      quantity: 1,
      unit: 'יח\'',
      unit_price: it.unit_price,
      line_total: it.unit_price,
      sort_order: i,
    }))
  )
  if (error) {
    console.error('insertItems error:', error)
    return 'שגיאה בשמירת שורות התמחור'
  }
  return null
}

async function insertScopeItems(supabase: SupabaseClient, quoteId: string, items: string[]): Promise<string | null> {
  if (items.length === 0) return null
  const { error } = await supabase.from('quote_scope_items').insert(
    items.map((description, i) => ({ quote_id: quoteId, description, sort_order: i }))
  )
  if (error) {
    console.error('insertScopeItems error:', error)
    return `שגיאה בשמירת "העבודה תכלול" (יתכן שהמיגרציה sql/phase6e_fixes.sql לא רצה): ${error.message}`
  }
  return null
}

async function insertPaymentTerms(supabase: SupabaseClient, quoteId: string, terms: PaymentTermInput[]): Promise<string | null> {
  if (terms.length === 0) return null
  const { error } = await supabase.from('quote_payment_terms').insert(
    terms.map((t, i) => ({
      quote_id: quoteId,
      percentage: t.percentage,
      description: t.description,
      trigger_status_id: t.trigger_status_id,
      sort_order: i,
    }))
  )
  if (error) {
    console.error('insertPaymentTerms error:', error)
    return `שגיאה בשמירת "אופן תשלום" (יתכן שהמיגרציה sql/phase6e_fixes.sql לא רצה): ${error.message}`
  }
  return null
}

async function saveQuoteRelatedData(
  supabase: SupabaseClient,
  quoteId: string,
  items: QuoteItemInput[],
  scopeItems: string[],
  paymentTerms: PaymentTermInput[]
): Promise<string | null> {
  const errors = (
    await Promise.all([
      insertItems(supabase, quoteId, items),
      insertScopeItems(supabase, quoteId, scopeItems),
      insertPaymentTerms(supabase, quoteId, paymentTerms),
    ])
  ).filter(Boolean)
  return errors.length > 0 ? errors.join(' | ') : null
}

/**
 * באישור הצעה - יוצר אוטומטית שלבי גבייה (payment_milestones) לפי טבלת אופן התשלום
 * של אותה הצעה, אם עוד לא נוצרו עבורה. הסכום מחושב מתוך הסכום הכולל (כולל מע"מ).
 * trigger_status_id מועתק מ-quote_payment_terms אל payment_milestones - כדי
 * שהאוטומציה ב-app/projects/actions.ts תוכל להשוות מולו כשסטטוס תיק משתנה.
 */
async function maybeCreateMilestones(supabase: SupabaseClient, quoteId: string, projectId: string, total: number) {
  const { data: existing } = await supabase.from('payment_milestones').select('id').eq('quote_id', quoteId).limit(1)
  if (existing && existing.length > 0) return

  const { data: terms } = await supabase
    .from('quote_payment_terms')
    .select('percentage, description, trigger_status_id, sort_order')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })

  if (!terms || terms.length === 0) return

  const { error } = await supabase.from('payment_milestones').insert(
    terms.map((t: any) => ({
      project_id: projectId,
      quote_id: quoteId,
      title: t.description || `${t.percentage}%`,
      amount: Math.round((Number(t.percentage) / 100) * total * 100) / 100,
      status: 'pending',
      trigger_status_id: t.trigger_status_id ?? null,
      sort_order: t.sort_order,
    }))
  )
  if (error) console.error('maybeCreateMilestones error:', error)
}

function buildAddressAndTitleAndDescription(formData: FormData) {
  const description = ((formData.get('description') as string) || '').trim() || null
  return { ...buildAddressAndTitle(formData), description }
}

function readCommonQuoteFields(formData: FormData) {
  return {
    recipientName: (formData.get('recipient_name') as string) || null,
    termsText: (formData.get('terms_text') as string) || null,
    notes: (formData.get('notes') as string) || null,
    includesConstruction: formData.get('includes_construction') === 'true',
    showPaymentCalculation: formData.get('show_payment_calculation') === 'true',
    showItemsTotal: formData.get('show_items_total') === 'true',
    items: parseItems(formData.get('items_json') as string),
    scopeItems: parseScopeItems(formData.get('scope_items_json') as string),
    paymentTerms: parsePaymentTerms(formData.get('payment_terms_json') as string),
    subtotal: Number(formData.get('subtotal')) || 0,
    discount: Number(formData.get('discount')) || 0,
    taxRate: Number(formData.get('tax_rate')) || 0,
    total: Number(formData.get('total')) || 0,
  }
}

export async function createQuoteWithProject(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const createdBy = await getSafeCreatedBy(supabase, user?.id)

  const clientId = formData.get('client_id') as string
  const f = readCommonQuoteFields(formData)
  const { street, houseNumber, city, addressNote, additionalContact, address, title, description } =
    buildAddressAndTitleAndDescription(formData)

  if (!clientId || !street || !city) {
    return { error: 'יש לבחור לקוח ולמלא רחוב ועיר' }
  }

  const year = new Date().getFullYear()

  const { data: caseNumberData, error: caseNumberError } = await supabase.rpc('generate_case_number', { p_year: year })
  if (caseNumberError) console.error('generate_case_number error:', caseNumberError)

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      client_id: clientId,
      title,
      address,
      street,
      house_number: houseNumber || null,
      city,
      address_note: addressNote,
      additional_contact: additionalContact,
      description,
      case_number: caseNumberData ?? null,
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (projectError || !project) {
    console.error('createQuoteWithProject (project insert) error:', projectError)
    return { error: 'שגיאה ביצירת התיק' }
  }

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      project_id: project.id,
      quote_number: caseNumberData ?? `${year}-${Date.now()}`,
      recipient_name: f.recipientName,
      terms_text: f.termsText,
      notes: f.notes,
      subtotal: f.subtotal,
      discount: f.discount,
      tax_rate: f.taxRate,
      total: f.total,
      includes_construction: f.includesConstruction,
      show_payment_calculation: f.showPaymentCalculation,
      show_items_total: f.showItemsTotal,
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (quoteError || !quote) {
    console.error('createQuoteWithProject (quote insert) error:', quoteError)
    return { error: 'שגיאה ביצירת הצעת המחיר' }
  }

  const saveError = await saveQuoteRelatedData(supabase, quote.id, f.items, f.scopeItems, f.paymentTerms)

  revalidatePath('/quotes')
  revalidatePath('/projects')
  revalidatePath('/dashboard')

  if (saveError) {
    redirect(`/quotes/${quote.id}?warning=${encodeURIComponent(saveError)}`)
  }
  redirect(`/quotes/${quote.id}`)
}

export async function addQuoteToProject(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const createdBy = await getSafeCreatedBy(supabase, user?.id)

  const projectId = formData.get('project_id') as string
  const f = readCommonQuoteFields(formData)

  if (!projectId) {
    return { error: 'לא נמצא תיק מקושר' }
  }

  const { data: project } = await supabase.from('projects').select('case_number').eq('id', projectId).maybeSingle()
  const caseNumber = project?.case_number ?? `${new Date().getFullYear()}-${Date.now()}`

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      project_id: projectId,
      quote_number: caseNumber,
      recipient_name: f.recipientName,
      terms_text: f.termsText,
      notes: f.notes,
      subtotal: f.subtotal,
      discount: f.discount,
      tax_rate: f.taxRate,
      total: f.total,
      includes_construction: f.includesConstruction,
      show_payment_calculation: f.showPaymentCalculation,
      show_items_total: f.showItemsTotal,
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (quoteError || !quote) {
    console.error('addQuoteToProject (quote insert) error:', quoteError)
    return { error: 'שגיאה ביצירת הצעת המחיר' }
  }

  const saveError = await saveQuoteRelatedData(supabase, quote.id, f.items, f.scopeItems, f.paymentTerms)

  revalidatePath('/quotes')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/dashboard')

  if (saveError) {
    redirect(`/quotes/${quote.id}?warning=${encodeURIComponent(saveError)}`)
  }
  redirect(`/quotes/${quote.id}`)
}

export async function reviseQuote(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const createdBy = await getSafeCreatedBy(supabase, user?.id)

  const oldId = formData.get('id') as string
  const projectId = formData.get('project_id') as string
  const f = readCommonQuoteFields(formData)

  const { street, houseNumber, city, addressNote, additionalContact, address, title, description } =
    buildAddressAndTitleAndDescription(formData)

  if (!street || !city) {
    return { error: 'יש למלא רחוב ועיר' }
  }

  const { data: projectRow, error: projectUpdateError } = await supabase
    .from('projects')
    .update({
      title,
      address,
      street,
      house_number: houseNumber || null,
      city,
      address_note: addressNote,
      additional_contact: additionalContact,
      description,
    })
    .eq('id', projectId)
    .select('case_number')
    .single()
  if (projectUpdateError) console.error('reviseQuote (project update) error:', projectUpdateError)

  const caseNumber = projectRow?.case_number ?? `${new Date().getFullYear()}-${Date.now()}`

  const { data: newQuote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      project_id: projectId,
      quote_number: caseNumber,
      recipient_name: f.recipientName,
      terms_text: f.termsText,
      notes: f.notes,
      subtotal: f.subtotal,
      discount: f.discount,
      tax_rate: f.taxRate,
      total: f.total,
      includes_construction: f.includesConstruction,
      show_payment_calculation: f.showPaymentCalculation,
      show_items_total: f.showItemsTotal,
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (quoteError || !newQuote) {
    console.error('reviseQuote (insert) error:', quoteError)
    return { error: 'שגיאה ביצירת הגרסה החדשה של ההצעה' }
  }

  const saveError = await saveQuoteRelatedData(supabase, newQuote.id, f.items, f.scopeItems, f.paymentTerms)

  const { error: archiveError } = await supabase
    .from('quotes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', oldId)

  revalidatePath('/quotes')
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/quotes/${oldId}`)

  if (archiveError) {
    console.error('reviseQuote (archive old) error:', archiveError)
    return {
      error:
        'הגרסה החדשה נשמרה, אבל לא הצלחתי להעביר את הגרסה הקודמת לארכיון (יתכן שהמיגרציה sql/phase6b_fixes.sql לא רצה - עמודת archived_at חסרה).',
    }
  }

  if (saveError) {
    redirect(`/quotes/${newQuote.id}?warning=${encodeURIComponent(saveError)}`)
  }
  redirect(`/quotes/${newQuote.id}`)
}

export async function setQuoteStatus(
  formData: FormData
): Promise<{ error: string | null; rejected?: boolean }> {
  const id = formData.get('quote_id') as string
  const status = formData.get('status') as string
  const projectId = formData.get('project_id') as string

  const supabase = await createClient()
  const payload: { status: string; archived_at?: string } = { status }
  if (status === 'rejected') {
    payload.archived_at = new Date().toISOString()
  }

  const { error } = await supabase.from('quotes').update(payload).eq('id', id)
  if (error) {
    console.error('setQuoteStatus error:', error)
    return { error: 'שגיאה בעדכון סטטוס ההצעה' }
  }

  if (status === 'approved') {
    const { data: quoteData } = await supabase.from('quotes').select('total').eq('id', id).maybeSingle()
    if (quoteData) {
      await maybeCreateMilestones(supabase, id, projectId, quoteData.total)
    }
  }

  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/collections')
  revalidatePath('/dashboard')

  return { error: null, rejected: status === 'rejected' }
}

export async function unarchiveQuote(id: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').update({ archived_at: null, keep_active: true }).eq('id', id)
  if (error) console.error('unarchiveQuote error:', error)
  revalidatePath('/quotes')
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/quotes/${id}`)
}

export async function deleteQuote(id: string, projectId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) {
    console.error('deleteQuote error:', error)
    return { error: 'שגיאה במחיקת ההצעה' }
  }
  revalidatePath('/quotes')
  revalidatePath(`/projects/${projectId}`)
  return { error: null }
}
