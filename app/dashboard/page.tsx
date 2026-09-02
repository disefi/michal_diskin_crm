import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import SearchBar from '@/components/SearchBar'
import UrgentCard from '@/components/UrgentCard'
import NotesPanel from '@/components/NotesPanel'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, title, address, status, urgency_level, created_at, clients(name)')
    .order('created_at', { ascending: false })

  const { data: notesData } = await supabase
    .from('notes')
    .select('id, title, content, project_id, reminder_date, created_at')
    .order('created_at', { ascending: false })

  const { data: milestonesData } = await supabase
    .from('payment_milestones')
    .select('id, status')

  const projects = (projectsData ?? []) as any[]
    const today = new Date().toISOString().slice(0, 10)
  const allNotes = notesData ?? []
  const notes = allNotes.filter((n) => !n.reminder_date || n.reminder_date <= today)
  const futureNotesCount = allNotes.length - notes.length
  const milestones = milestonesData ?? []

  const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'cancelled')
  const approvedCount = projects.filter((p) => p.status === 'approved').length
  const pendingMilestones = milestones.filter((m) => m.status !== 'paid')

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

  const recentProjects = projects.slice(0, 8)

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">דשבורד</h1>
        <SearchBar />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">📂 תיקים פתוחים</div>
          <div className="text-3xl font-bold mt-1">{activeProjects.length}</div>
        </div>
        <Link href="/collections" className="bg-white rounded-lg shadow p-5 block hover:ring-2 hover:ring-gray-300">
          <div className="text-sm text-gray-500">💰 גביות ממתינות</div>
          <div className="text-3xl font-bold mt-1">{pendingMilestones.length}</div>
        </Link>
        <div className="bg-white rounded-lg shadow p-5 ring-2 ring-green-400">
          <div className="text-sm text-gray-500">🎉 פרויקטים שאושרו</div>
          <div className="text-3xl font-bold mt-1">{approvedCount}</div>
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
        <NotesPanel notes={notes} projects={allProjectsForSelect} />
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">🔔 התראות מערכת</h2>
          <p className="text-gray-400 text-sm">
            אין התראות כרגע - פיצ&apos;ר התראות אוטומטיות על תיקים "תקועים" ייבנה בשלב עתידי
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">תיקים אחרונים</h2>
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="p-3">פרויקט</th>
                <th className="p-3">לקוח</th>
                <th className="p-3">כתובת</th>
                <th className="p-3">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-0">
                    <Link href={`/projects/${p.id}`} className="block p-3">{p.title}</Link>
                  </td>
                  <td className="p-3">{p.clients?.name ?? '-'}</td>
                  <td className="p-3">{p.address ?? '-'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentProjects.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-400">אין פרויקטים עדיין</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}