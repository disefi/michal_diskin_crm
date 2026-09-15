import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import ProjectDetail from '@/components/ProjectDetail'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProjectStatus, NudnikSettings } from '@/lib/constants'
import { getStaleInfo } from '@/lib/staleness'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select(
      'id, case_number, street, house_number, city, address_note, additional_contact, description, status_id, status_changed_at, stale_snoozed_until, urgency_level, client_id, clients(name)'
    )
    .eq('id', id)
    .maybeSingle()

  if (!project) notFound()

  const { data: clientsData } = await supabase.from('clients').select('id, name').order('name')

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

  const badgeInfo = getStaleInfo(
    (project as any).status_id,
    (project as any).status_changed_at,
    (project as any).stale_snoozed_until,
    statuses,
    nudnikSettings.hide_badge_while_snoozed
  )

  const { data: quotesData } = await supabase
    .from('quotes')
    .select('id, quote_number, status, total, subtotal, discount, created_at, archived_at, includes_construction')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: notesData } = await supabase
    .from('notes')
    .select('id, title, content, reminder_date, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const { data: paymentsData } = await supabase
    .from('payment_milestones')
    .select('id, title, amount, status, paid_amount')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  return (
    <AppShell>
      <Link href="/projects" className="text-sm text-gray-500 hover:underline">← חזרה לרשימת התיקים</Link>
      <div className="mt-4">
        <ProjectDetail
          project={{
            id: project.id,
            case_number: (project as any).case_number,
            street: (project as any).street,
            house_number: (project as any).house_number,
            city: (project as any).city,
            address_note: (project as any).address_note,
            additional_contact: (project as any).additional_contact,
            description: project.description,
            status_id: (project as any).status_id,
            status_changed_at: (project as any).status_changed_at,
            stale: badgeInfo.showBadge,
            staleDays: badgeInfo.days,
            urgency_level: project.urgency_level,
            client_id: (project as any).client_id,
            client: (project as any).clients?.name ?? '-',
          }}
          clients={clientsData ?? []}
          statuses={statuses}
          quotes={quotesData ?? []}
          notes={notesData ?? []}
          payments={paymentsData ?? []}
        />
      </div>
    </AppShell>
  )
}
