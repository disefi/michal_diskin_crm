'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setUrgency(formData: FormData) {
  const projectId = formData.get('project_id') as string
  const level = formData.get('urgency_level') as string
  const supabase = await createClient()
  const { error } = await supabase.from('projects').update({ urgency_level: level }).eq('id', projectId)
  if (error) console.error('setUrgency error:', error)
  revalidatePath('/dashboard')
}

export async function saveNote(formData: FormData) {
  const id = formData.get('id') as string | null
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const projectId = (formData.get('project_id') as string) || null
  const reminderDate = (formData.get('reminder_date') as string) || null

  const supabase = await createClient()
  const payload = {
    title: title || null,
    content,
    project_id: projectId,
    reminder_date: reminderDate,
  }

  if (id) {
    const { error } = await supabase.from('notes').update(payload).eq('id', id)
    if (error) console.error('saveNote (update) error:', error)
  } else {
    const { error } = await supabase.from('notes').insert(payload)
    if (error) console.error('saveNote (insert) error:', error)
  }
  revalidatePath('/dashboard')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function deleteNote(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) console.error('deleteNote error:', error)
  revalidatePath('/dashboard')
}

export async function completeNote(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) console.error('completeNote error:', error)
  revalidatePath('/dashboard')
}