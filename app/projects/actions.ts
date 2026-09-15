'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { buildAddressAndTitle } from '@/lib/buildProjectAddress'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function revalidateProjectPaths(id: string) {
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/in-progress')
  revalidatePath('/archive')
  revalidatePath('/collections')
}

/**
 * האוטומציה שסיכמנו: כשתיק עובר לסטטוס מסוים, בודקת אם יש לו payment_milestones
 * שהתגית הפנימית שלהם (trigger_status_id, שנקבעה מראש ב"אופן תשלום" בהצעה)
 * תואמת לסטטוס החדש - ואם כן, מעדכנת אותם ל-status='requested' (בדיוק כמו
 * שינוי ידני של הסטטוס ב-/collections), מה שמדליק את ההתראה הקיימת בדשבורד.
 * מעדכנת רק שורות שעדיין 'pending' - לא דורסת שורה שכבר requested/partial/paid.
 * (Phase 9b - איחוד השדה הכפול condition_met+status לשדה status יחיד)
 */
async function autoMarkMilestonesConditionMet(supabase: SupabaseClient, projectId: string, statusId: string | null) {
  if (!statusId) return
  const { data: matches, error } = await supabase
    .from('payment_milestones')
    .select('id')
    .eq('project_id', projectId)
    .eq('trigger_status_id', statusId)
    .eq('status', 'pending')

  if (error) {
    console.error('autoMarkMilestonesConditionMet (select) error:', error)
    return
  }
  if (!matches || matches.length === 0) return

  const { error: updateError } = await supabase
    .from('payment_milestones')
    .update({ status: 'requested' })
    .in('id', matches.map((m) => m.id))

  if (updateError) console.error('autoMarkMilestonesConditionMet (update) error:', updateError)
}

export async function saveProject(formData: FormData) {
  const id = formData.get('id') as string
  const client_id = formData.get('client_id') as string
  const description = (formData.get('description') as string) || null
  const status_id = (formData.get('status_id') as string) || null
  const urgency_level = formData.get('urgency_level') as string

  const { street, houseNumber, city, addressNote, additionalContact, address, title } = buildAddressAndTitle(formData)

  const supabase = await createClient()

  // Phase 8 ("נודניק") - status_changed_at מתעדכן רק אם status_id בפועל השתנה,
  // לא בכל שמירה (כדי לא "לאפס" את השעון בכל עריכה קטנה של פרטי התיק)
  const { data: existing } = await supabase.from('projects').select('status_id').eq('id', id).maybeSingle()
  const statusChanged = existing && existing.status_id !== status_id

  const { error } = await supabase
    .from('projects')
    .update({
      client_id,
      title,
      address,
      street,
      house_number: houseNumber || null,
      city,
      address_note: addressNote,
      additional_contact: additionalContact,
      description,
      status_id,
      urgency_level,
      ...(statusChanged ? { status_changed_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)

  if (error) console.error('saveProject error:', error)
  else await autoMarkMilestonesConditionMet(supabase, id, status_id)

  revalidateProjectPaths(id)
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  revalidateProjectPaths(id)

  if (error) {
    console.error('deleteProject error:', error)
    if (error.code === '23503') {
      return { error: 'לא ניתן למחוק תיק זה - יש לו הצעות מחיר או נתונים משויכים. יש למחוק אותם קודם.' }
    }
    return { error: 'שגיאה במחיקת התיק' }
  }
  return { error: null }
}

/** שינוי סטטוס inline - בלי לפתוח את חלון העריכה המלאה */
export async function setProjectStatus(formData: FormData) {
  const id = formData.get('project_id') as string
  const status_id = (formData.get('status_id') as string) || null
  const supabase = await createClient()

  const { data: existing } = await supabase.from('projects').select('status_id').eq('id', id).maybeSingle()
  const statusChanged = existing && existing.status_id !== status_id

  const { error } = await supabase
    .from('projects')
    .update({ status_id, ...(statusChanged ? { status_changed_at: new Date().toISOString() } : {}) })
    .eq('id', id)
  if (error) console.error('setProjectStatus error:', error)
  else await autoMarkMilestonesConditionMet(supabase, id, status_id)
  revalidateProjectPaths(id)
}

/** שינוי דחיפות inline - בלי לפתוח את חלון העריכה המלאה */
export async function setProjectUrgency(formData: FormData) {
  const id = formData.get('project_id') as string
  const urgency_level = formData.get('urgency_level') as string
  const supabase = await createClient()
  const { error } = await supabase.from('projects').update({ urgency_level }).eq('id', id)
  if (error) console.error('setProjectUrgency error:', error)
  revalidateProjectPaths(id)
}

/**
 * Phase 8b ("נודניק") - דחיית התראת "תיק תקוע" ב-days ימים מעכשיו.
 * days מגיע מהצד הקורא (חלונית הדחייה בדשבורד) - תמיד שווה ל-stale_after_days
 * של הסטטוס הנוכחי של התיק באותו רגע, לפי ההחלטה שסוכמה.
 */
export async function snoozeStaleProject(projectId: string, days: number): Promise<{ error: string | null }> {
  if (!projectId || !days || days < 1) return { error: 'נתונים חסרים' }
  const supabase = await createClient()
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('projects').update({ stale_snoozed_until: until }).eq('id', projectId)
  if (error) {
    console.error('snoozeStaleProject error:', error)
    return { error: 'שגיאה בדחיית ההתראה' }
  }
  revalidateProjectPaths(projectId)
  return { error: null }
}
