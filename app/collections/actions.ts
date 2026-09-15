'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Phase 9b - שדה סטטוס יחיד במקום condition_met+status כפולים. status='partial'
 * דורש גם paid_amount (כמה שולם בפועל מתוך הסכום המלא) - שדה חדש בטבלה.
 */
export async function setMilestoneStatus(formData: FormData) {
  const id = formData.get('milestone_id') as string
  const status = formData.get('status') as string
  const paidAmountRaw = formData.get('paid_amount') as string | null

  const supabase = await createClient()
  const payload: { status: string; requested_at?: string; paid_at?: string; paid_amount?: number } = { status }
  if (status === 'requested') payload.requested_at = new Date().toISOString()
  if (status === 'paid') payload.paid_at = new Date().toISOString()

  if (status === 'partial') {
    const amt = Number(paidAmountRaw)
    payload.paid_amount = Number.isFinite(amt) && amt > 0 ? amt : 0
  } else {
    // רק 'partial' משתמש בסכום חלקי - בכל סטטוס אחר מאפסים כדי לא להשאיר ערך ישן ומטעה
    payload.paid_amount = 0
  }

  const { data, error } = await supabase
    .from('payment_milestones')
    .update(payload)
    .eq('id', id)
    .select('project_id')
    .maybeSingle()
  if (error) console.error('setMilestoneStatus error:', error)

  revalidatePath('/collections')
  revalidatePath('/dashboard')
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`)
}
