import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import SearchBar from '@/components/SearchBar'
import UrgentCard from '@/components/UrgentCard'
import NotesPanel from '@/components/NotesPanel'
import ProjectsTable, { ProjectRow } from '@/components/ProjectsTable'
import StaleAlertsList, { StaleAlertRow } from '@/components/StaleAlertsList'
import { ProjectStatus, NudnikSettings } from '@/lib/constants'
import { getStaleInfo } from '@/lib/staleness'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: statusesData } = await supabase
    .from('project_statuses')
    .select('id, label, color, sort_order, is_active, visible_in, stale_after_days')
    .order('sort_order', { ascending: true })
  const statuses = (statusesData ?? []) as ProjectStatus[]
  // "תיקים פתוחים" = הסטטוס שלו לא מסומן כ"ארכיון" (מחליף את status !== completed/cancelled הקבוע)
  const archiveStatusIds = new Set(statuses.filter((s) => s.visible_in.includes('archive')).map((s) => s.id))

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

  const { data: notesData } = await supabase
    .from('notes')
    .select('id, title, content, project_id, reminder_date, created_at')
    .order('created_at', { ascending: false })

  const { data: milestonesData } = await supabase
    .from('payment_milestones')
    .select('id, title, amount, status, projects(id, title, clients(name))')

  // "פרויקטים שאושרו" - נספר לפי הצעות מחיר בסטטוס approved (לא ארכיון), לא לפי סטטוס תיק חופשי
  const { data: approvedQuotesData } = await supabase
    .from('quotes')
    .select('project_id')
    .eq('status', 'approved')
    .is('archived_at', null)

  const projects = (projectsData ?? []) as any[]
  const today = new Date().toISOString().slice(0, 10)
  const allNotes = notesData ?? []
  const notes = allNotes.filter((n) => !n.reminder_date || n.reminder_date <= today)
  const futureNotesCount = allNotes.length - notes.length
  const milestones = (milestonesData ?? []) as any[]

  const activeProjects = projects.filter((p) => !p.status_id || !archiveStatusIds.has(p.status_id))
  const approvedProjectIds = new Set((approvedQuotesData ?? []).map((q: any) => q.project_id))
  const approvedCount = approvedProjectIds.size
  const pendingMilestones = milestones.filter((m) => m.status !== 'paid')
  // Phase 9b - שדה status יחיד. 'requested' מוגדר אוטומטית כשהתנאי מתקיים
  // (autoMarkMilestonesConditionMet) או ידנית ב-/collections - זה מה שמדליק את ההתראה.
  const collectionAlerts = milestones.filter((m) => m.status === 'requested')

  // Phase 8 + 8b ("נודניק") - תיקים שחצו את הסף שהוגדר לסטטוס הנוכחי שלהם ולא בדחייה כרגע.
  // תיקים בארכיון לא נבדקים כלל (מטופל בתוך getStaleInfo).
  const staleAlerts: StaleAlertRow[] = projects
    .map((p) => {
      const status = statuses.find((s) => s.id === p.status_id)
      const info = getStaleInfo(p.status_id, p.status_changed_at, p.stale_snoozed_until, statuses, nudnikSettings.hide_badge_while_snoozed)
      return {
        id: p.id,
        title: p.title,
        client: p.clients?.name ?? '-',
        days: info.days,
        snoozeDays: status?.stale_after_days ?? 7,
        showInAlerts: info.showInAlerts,
      }
    })
    .filter((p) => p.showInAlerts)
    .sort((a, b) => b.days - a.days)

  const urgentProjects = projects
    .filter((p) => p.urgency_level !== 'normal')
    .map((p) => ({
      id: p.id,
      title: p.title,
      client: p.clients?.name ?? '-',
      address: p.address ?? '-',
      urgency_level: p.urgency_level,
    }))

  const allProjectsForSelect = projects.map((p) => ({
    id: p.id,
    title: p.title,
    client: p.clients?.name ?? '-',
  }))

  const recentProjects: ProjectRow[] = projects.slice(0, 8).map((p) => {
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">דשבורד</h1>
        <SearchBar />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">📂 תיקים פתוחים</div>
          <div className="text-3xl font-bold mt-1">{activeProjects.length}</div>
        </div>
        <Link href="/collections" className="bg-white rounded-lg shadow p-5 block hover:ring-2 hover:ring-gray-300">
          <div className="text-sm text-gray-500">💰 תשלומים ממתינים</div>
          <div className="text-3xl font-bold mt-1">{pendingMilestones.length}</div>
        </Link>
        <div className="bg-white rounded-lg shadow p-5 ring-2 ring-green-400">
          <div className="text-sm text-gray-500">🎉 פרויקטים שאושרו</div>
          <div className="text-3xl font-bold mt-1">{approvedCount}</div>
        </div>
        <div className={`bg-white rounded-lg shadow p-5 ${staleAlerts.length > 0 ? 'ring-2 ring-amber-400' : ''}`}>
          <div className="text-sm text-gray-500">🐌 תיקים תקועים</div>
          <div className="text-3xl font-bold mt-1">{staleAlerts.length}</div>
        </div>
      </div>

      <div className="mb-6">
        <Link
          href="/quotes/new"
          className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          + הצעת מחיר חדשה
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UrgentCard allProjects={allProjectsForSelect} urgentProjects={urgentProjects as any} />
        <NotesPanel notes={notes} futureCount={futureNotesCount} projects={allProjectsForSelect} />
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">🔔 התראות מערכת</h2>
          {collectionAlerts.length === 0 ? (
            <p className="text-gray-400 text-sm">אין התראות כרגע</p>
          ) : (
            <ul className="space-y-2">
              {collectionAlerts.map((m) => (
                <li key={m.id}>
                  <Link
                    href="/collections"
                    className="flex items-center justify-between text-sm border-b py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <span>
                      💰 לדרוש תשלום: {m.title} - {m.projects?.title ?? '-'} ({m.projects?.clients?.name ?? '-'})
                    </span>
                    <span className="font-medium">₪{Number(m.amount).toLocaleString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">🐌 תיקים תקועים</h2>
          <StaleAlertsList projects={staleAlerts} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">תיקים אחרונים</h2>
        <ProjectsTable projects={recentProjects} clients={clientsData ?? []} statuses={statuses} showStatusFilter={false} showActions={false} />
      </div>
    </AppShell>
  )
}
