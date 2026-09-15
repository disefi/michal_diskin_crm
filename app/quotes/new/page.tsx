import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import NewQuoteForm from '@/components/NewQuoteForm'
import { DEFAULT_TERMS_TEXT, ProjectStatus } from '@/lib/constants'

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string }>
}) {
  const { project_id } = await searchParams
  const supabase = await createClient()

  const { data: clientsData } = await supabase.from('clients').select('id, name').order('name')

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

  let existingProject: { id: string; title: string; client: string; case_number: string | null } | null = null
  if (project_id) {
    const { data } = await supabase
      .from('projects')
      .select('id, title, case_number, clients(name)')
      .eq('id', project_id)
      .maybeSingle()
    if (data) {
      existingProject = {
        id: data.id,
        title: data.title,
        case_number: (data as any).case_number,
        client: (data as any).clients?.name ?? '-',
      }
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">הצעת מחיר חדשה</h1>
      <NewQuoteForm
        clients={clientsData ?? []}
        existingProject={existingProject}
        businessProfile={businessProfileData ?? null}
        defaultTermsText={DEFAULT_TERMS_TEXT}
        statuses={statuses}
      />
    </AppShell>
  )
}
