'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveClient(formData: FormData) {
  const id = (formData.get('id') as string) || null
  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string) || null
  const email = (formData.get('email') as string) || null
  const address = (formData.get('address') as string) || null
  const notes = (formData.get('notes') as string) || null

  const supabase = await createClient()
  const payload = { name, phone, email, address, notes }

  if (id) {
    const { error } = await supabase.from('clients').update(payload).eq('id', id)
    if (error) console.error('saveClient (update) error:', error)
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({ ...payload, created_by: user?.id ?? null })
    if (error) console.error('saveClient (insert) error:', error)
  }
  revalidatePath('/clients')
}

export async function deleteClient(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  revalidatePath('/clients')

  if (error) {
    console.error('deleteClient error:', error)
    if (error.code === '23503') {
      return { error: 'לא ניתן למחוק לקוח זה - יש לו פרויקטים משויכים. יש למחוק או להעביר קודם את הפרויקטים שלו.' }
    }
    return { error: 'שגיאה במחיקת הלקוח' }
  }
  return { error: null }
}
