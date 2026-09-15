'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ==========================================
// פרטי עסק (BusinessProfileSettings.tsx)
// ==========================================

export async function saveBusinessProfile(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const payload = {
    business_name: (formData.get('business_name') as string) || null,
    subtitle: (formData.get('subtitle') as string) || null,
    email: (formData.get('email') as string) || null,
    business_number: (formData.get('business_number') as string) || null,
    phone1: (formData.get('phone1') as string) || null,
    phone2: (formData.get('phone2') as string) || null,
  }

  const { error } = await supabase.from('business_profile').upsert({ id: true, ...payload }, { onConflict: 'id' })

  if (error) {
    console.error('saveBusinessProfile error:', error)
    return { error: 'שגיאה בשמירת פרטי העסק' }
  }
  revalidatePath('/settings')
  return { error: null }
}

/** שומר URL של קובץ שכבר הועלה ל-Storage (לוגו או חתימה) לפרופיל העסק */
export async function saveBusinessAssetUrl(
  field: 'logo_url' | 'signature_url',
  url: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('business_profile').upsert({ id: true, [field]: url }, { onConflict: 'id' })

  if (error) {
    console.error('saveBusinessAssetUrl error:', error)
    return { error: 'שגיאה בשמירת הקובץ' }
  }
  revalidatePath('/settings')
  return { error: null }
}

// ==========================================
// מספור תיקים (CaseNumberSettings.tsx)
// ==========================================

/**
 * קביעת נקודת ההתחלה למספור תיקים בשנה נתונה. ננעל אחרי שהונפק כבר מספר
 * תיק אחד לפחות לאותה שנה (case_number_counters), כדי לא ליצור התנגשויות
 * עם מספרים שכבר הוקצו בפועל.
 */
export async function saveCaseNumberSetting(formData: FormData): Promise<{ error: string | null }> {
  const year = Number(formData.get('year'))
  const start_number = Number(formData.get('start_number'))
  if (!year || !start_number) return { error: 'נתונים חסרים' }

  const supabase = await createClient()

  const { data: existingCounter } = await supabase
    .from('case_number_counters')
    .select('last_number')
    .eq('year', year)
    .maybeSingle()

  if (existingCounter) {
    return { error: `כבר הונפקו מספרי תיק לשנת ${year} - לא ניתן לשנות את נקודת ההתחלה שלה יותר` }
  }

  const { error } = await supabase
    .from('case_number_settings')
    .upsert({ year, start_number }, { onConflict: 'year' })

  if (error) {
    console.error('saveCaseNumberSetting error:', error)
    return { error: 'שגיאה בשמירת הגדרת המספור' }
  }
  revalidatePath('/settings')
  return { error: null }
}

// ==========================================
// ארכיון אוטומטי להצעות מחיר (QuoteArchiveSettings.tsx)
// ==========================================

export async function saveQuoteArchiveMonths(formData: FormData): Promise<{ error: string | null }> {
  const months = Number(formData.get('months'))
  if (!months || months < 1) return { error: 'יש להזין מספר חודשים תקין' }

  const supabase = await createClient()
  const { error } = await supabase.from('quote_archive_settings').upsert({ id: true, months }, { onConflict: 'id' })

  if (error) {
    console.error('saveQuoteArchiveMonths error:', error)
    return { error: 'שגיאה בשמירת הגדרת הארכיון' }
  }
  revalidatePath('/settings')
  return { error: null }
}

// ==========================================
// מערכת סטטוסים דינמית (Phase 7) - project_statuses
// ==========================================

const VISIBLE_IN_OPTIONS = ['projects', 'in_progress', 'archive', 'dashboard', 'quotes', 'collections'] as const

function parseVisibleIn(formData: FormData): string[] {
  return VISIBLE_IN_OPTIONS.filter((key) => formData.get(`visible_in_${key}`) === 'true')
}

/** Phase 8 ("נודניק") - שדה ריק = null = אין בדיקת "תקוע" לסטטוס הזה */
function parseStaleAfterDays(formData: FormData): number | null {
  const raw = (formData.get('stale_after_days') as string)?.trim()
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

function revalidateStatusPaths() {
  revalidatePath('/settings')
  revalidatePath('/projects')
  revalidatePath('/in-progress')
  revalidatePath('/archive')
  revalidatePath('/dashboard')
  revalidatePath('/collections')
  revalidatePath('/quotes')
}

/** הוספת סטטוס פרויקט חדש לרשימה הדינמית */
export async function addProjectStatus(formData: FormData): Promise<{ error: string | null }> {
  const label = (formData.get('label') as string)?.trim()
  const color = (formData.get('color') as string) || 'bg-gray-100 text-gray-800'
  if (!label) return { error: 'יש להזין שם לסטטוס' }

  const supabase = await createClient()

  const { data: duplicate } = await supabase
    .from('project_statuses')
    .select('id')
    .ilike('label', label)
    .maybeSingle()
  if (duplicate) return { error: `כבר קיים סטטוס בשם "${label}"` }

  const { data: maxRow } = await supabase
    .from('project_statuses')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1

  const { error } = await supabase.from('project_statuses').insert({
    label,
    color,
    sort_order: nextSortOrder,
    visible_in: parseVisibleIn(formData),
    stale_after_days: parseStaleAfterDays(formData),
  })

  if (error) {
    console.error('addProjectStatus error:', error)
    return { error: 'שגיאה בהוספת הסטטוס' }
  }
  revalidateStatusPaths()
  return { error: null }
}

/** עריכת סטטוס קיים - שם, צבע, ואיפה הוא מוצג */
export async function updateProjectStatus(formData: FormData): Promise<{ error: string | null }> {
  const id = formData.get('id') as string
  const label = (formData.get('label') as string)?.trim()
  const color = (formData.get('color') as string) || 'bg-gray-100 text-gray-800'
  if (!id || !label) return { error: 'נתונים חסרים' }

  const supabase = await createClient()

  const { data: duplicate } = await supabase
    .from('project_statuses')
    .select('id')
    .ilike('label', label)
    .neq('id', id)
    .maybeSingle()
  if (duplicate) return { error: `כבר קיים סטטוס בשם "${label}"` }

  const { error } = await supabase
    .from('project_statuses')
    .update({ label, color, visible_in: parseVisibleIn(formData), stale_after_days: parseStaleAfterDays(formData) })
    .eq('id', id)

  if (error) {
    console.error('updateProjectStatus error:', error)
    return { error: 'שגיאה בעדכון הסטטוס' }
  }
  revalidateStatusPaths()
  return { error: null }
}

/**
 * מחיקה "רכה" בלבד (is_active=false) - לא מוחקים בפועל כדי לא לשבור תיקים
 * ישנים שכבר משויכים לסטטוס הזה.
 */
export async function deactivateProjectStatus(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_statuses').update({ is_active: false }).eq('id', id)
  if (error) {
    console.error('deactivateProjectStatus error:', error)
    return { error: 'שגיאה בהשבתת הסטטוס' }
  }
  revalidateStatusPaths()
  return { error: null }
}

export async function reactivateProjectStatus(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('project_statuses').update({ is_active: true }).eq('id', id)
  if (error) {
    console.error('reactivateProjectStatus error:', error)
    return { error: 'שגיאה בהפעלת הסטטוס מחדש' }
  }
  revalidateStatusPaths()
  return { error: null }
}

/**
 * מחיקה אמיתית ולצמיתות - מותרת רק אם אין שום שימוש בפועל בסטטוס הזה, באף
 * אחד משלושת המקומות שמפנים אליו: תיקים (status_id), תגית שורת תשלום בהצעה
 * (quote_payment_terms.trigger_status_id), ושלב גבייה שכבר נוצר עם התגית
 * הזו (payment_milestones.trigger_status_id). אם יש שימוש כלשהו - מחזירה
 * שגיאה ומציעה להשבית במקום, כדי לא לשבור נתונים היסטוריים.
 */
export async function deleteProjectStatus(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const [{ count: projectsCount }, { count: paymentTermsCount }, { count: milestonesCount }] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status_id', id),
    supabase.from('quote_payment_terms').select('id', { count: 'exact', head: true }).eq('trigger_status_id', id),
    supabase.from('payment_milestones').select('id', { count: 'exact', head: true }).eq('trigger_status_id', id),
  ])

  const totalUsage = (projectsCount ?? 0) + (paymentTermsCount ?? 0) + (milestonesCount ?? 0)
  if (totalUsage > 0) {
    return {
      error: `לא ניתן למחוק - הסטטוס בשימוש (${projectsCount ?? 0} תיקים, ${paymentTermsCount ?? 0} תגיות בהצעות, ${milestonesCount ?? 0} שלבי גבייה). ניתן להשבית אותו במקום.`,
    }
  }

  const { error } = await supabase.from('project_statuses').delete().eq('id', id)
  if (error) {
    console.error('deleteProjectStatus error:', error)
    return { error: 'שגיאה במחיקת הסטטוס' }
  }
  revalidateStatusPaths()
  return { error: null }
}

/** שינוי סדר - מקבל את כל רשימת ה-id-ים לפי הסדר הרצוי החדש */
export async function reorderProjectStatuses(orderedIds: string[]): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const errors = (
    await Promise.all(
      orderedIds.map((id, i) => supabase.from('project_statuses').update({ sort_order: i }).eq('id', id))
    )
  )
    .map((r) => r.error)
    .filter(Boolean)

  if (errors.length > 0) {
    console.error('reorderProjectStatuses error:', errors)
    return { error: 'שגיאה בשמירת הסדר' }
  }
  revalidateStatusPaths()
  return { error: null }
}

// ==========================================
// הגדרת נודניק גלובלית (Phase 8b) - nudnik_settings
// ==========================================

export async function saveNudnikSettings(formData: FormData): Promise<{ error: string | null }> {
  const hide_badge_while_snoozed = formData.get('hide_badge_while_snoozed') === 'true'
  const supabase = await createClient()
  const { error } = await supabase
    .from('nudnik_settings')
    .upsert({ id: true, hide_badge_while_snoozed }, { onConflict: 'id' })

  if (error) {
    console.error('saveNudnikSettings error:', error)
    return { error: 'שגיאה בשמירת הגדרת הנודניק' }
  }
  revalidateStatusPaths()
  return { error: null }
}
