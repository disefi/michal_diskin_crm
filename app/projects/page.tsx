import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import ProjectsTable, { ProjectRow } from '@/components/ProjectsTable'
import { ProjectStatus, NudnikSettings } from '@/lib/constants'
import { getStaleInfo } from '@/lib/staleness'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: statusesData } = await supabase
    .from('project_statuses')
    .select('id, label, color, sort_order, is_active, visible_in, stale_after_days')
    .order('sort_order', { ascending: true })
  const statuses = (statusesData ?? []) as ProjectStatus[]

  const { data: nudnikSettingsData } = await supabase
    .from('nudnik_settings')
    .select('hide_badge_while_snoozed')
    .eq('id', true)
    .maybeSingle()
  const nudnikSettings: NudnikSettings = { hide_badge_while_snoozed: nudnikSettingsData?.hide_badge_while_snoozed ?? true }

  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, case_number, title, address, street, house_number, city, address_note, additional_contact, description, status_id, status_changed_at, stale_snoozed_until, urgency_level, created_at, client_id, clients(name)')
    .order('created_at', { ascending: false })

  const { data: clientsData } = await supabase.from('clients').select('id, name').order('name')

  const projects: ProjectRow[] = (projectsData ?? []).map((p: any) => {
    const badgeInfo = getStaleInfo(p.status_id, p.status_changed_at, p.stale_snoozed_until, statuses, nudnikSettings.hide_badge_while_snoozed)
    return {
      id: p.id,
      case_number: p.case_number,
      title: p.title,
      client: p.clients?.name ?? '-',
      client_id: p.client_id,
      address: p.address,
      street: p.street,
      house_number: p.house_number,
      city: p.city,
      address_note: p.address_note,
      additional_contact: p.additional_contact,
      description: p.description,
      status_id: p.status_id,
      status_changed_at: p.status_changed_at,
      stale: badgeInfo.showBadge,
      staleDays: badgeInfo.days,
      urgency_level: p.urgency_level,
      created_at: p.created_at,
    }
  })

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">תיקים (פרויקטים)</h1>
      <ProjectsTable projects={projects} clients={clientsData ?? []} statuses={statuses} />
    </AppShell>
  )
}
