'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setMilestoneStatus(formData: FormData) {
  const id = formData.get('milestone_id') as string
  const status = formData.get('status') as string

  const supabase = await createClient()
  const payload: { status: string; requested_at?: string; paid_at?: string } = { status }
  if (status === 'requested') payload.requested_at = new Date().toISOString()
  if (status === 'paid') payload.paid_at = new Date().toISOString()

  const { error } = await supabase.from('payment_milestones').update(payload).eq('id', id)
  if (error) console.error('setMilestoneStatus error:', error)

  revalidatePath('/collections')
  revalidatePath('/dashboard')
}

/** מסמן שהתנאי לתשלום התקיים בפועל (למשל "נשלחו הנחיות") - זה מה שמדליק את ההתראה בדשבורד */
export async function toggleConditionMet(id: string, met: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('payment_milestones')
    .update({ condition_met: met, condition_met_at: met ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) console.error('toggleConditionMet error:', error)

  revalidatePath('/collections')
  revalidatePath('/dashboard')
}
