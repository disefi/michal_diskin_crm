import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import CollectionsTable, { MilestoneRow } from '@/components/CollectionsTable'
import { ProjectStatus } from '@/lib/constants'

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: statusesData } = await supabase
    .from('project_statuses')
    .select('id, label, color, sort_order, is_active, visible_in')
    .order('sort_order', { ascending: true })
  const statuses = (statusesData ?? []) as ProjectStatus[]
  const collectionsVisibleIds = new Set(statuses.filter((s) => s.visible_in.includes('collections')).map((s) => s.id))
  const statusById = new Map(statuses.map((s) => [s.id, s]))

  const { data } = await supabase
    .from('payment_milestones')
    .select('id, title, amount, status, condition_met, trigger_status_id, projects(id, title, status_id, clients(name))')
    .order('created_at', { ascending: false })

  const milestones: MilestoneRow[] = (data ?? [])
    .filter((m: any) => {
      const projectStatusId = m.projects?.status_id
      const visibleByStatus = !!projectStatusId && collectionsVisibleIds.has(projectStatusId)
      // הגנה אוטומטית: גם אם הסטטוס הנוכחי של התיק לא מסומן לגבייה, כל עוד יש
      // חוב שעדיין לא שולם - הוא ימשיך להופיע כאן, כדי שלא תפספס תשלום בטעות
      const hasUnpaidDebt = m.status !== 'paid'
      return visibleByStatus || hasUnpaidDebt
    })
    .map((m: any) => {
      const trigger = m.trigger_status_id ? statusById.get(m.trigger_status_id) : undefined
      return {
        id: m.id,
        title: m.title,
        amount: m.amount,
        status: m.status,
        condition_met: m.condition_met,
        project_id: m.projects?.id ?? '',
        project_title: m.projects?.title ?? '-',
        client: m.projects?.clients?.name ?? '-',
        trigger_status_label: trigger?.label ?? null,
        trigger_status_color: trigger?.color ?? null,
      }
    })

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-2">גביות</h1>
      <p className="text-sm text-gray-500 mb-4">
        שלבי הגבייה נוצרים אוטומטית מ&quot;אופן תשלום&quot; באישור הצעת מחיר. סמן &quot;התקיים&quot; כשהתנאי
        בפועל מתקיים - זה יופיע כהתראה בדשבורד לדרוש תשלום. אם הוגדרה לשורה תגית סטטוס, היא תסומן
        אוטומטית ברגע שהתיק מגיע לאותו סטטוס.
      </p>
      <CollectionsTable milestones={milestones} />
    </AppShell>
  )
}
