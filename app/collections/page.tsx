import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import CollectionsTable, { MilestoneRow } from '@/components/CollectionsTable'
import PaidPaymentsList, { PaidMilestoneRow } from '@/components/PaidPaymentsList'
import FutureCollectionsSummary, { FutureCollectionRow } from '@/components/FutureCollectionsSummary'
import { ProjectStatus } from '@/lib/constants'

function outstanding(m: MilestoneRow): number {
  return m.status === 'partial' ? Math.max(0, Number(m.amount) - Number(m.paid_amount)) : Number(m.amount)
}

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: statusesData } = await supabase
    .from('project_statuses')
    .select('id, label, color, sort_order, is_active, visible_in, stale_after_days')
    .order('sort_order', { ascending: true })
  const statuses = (statusesData ?? []) as ProjectStatus[]
  const statusById = new Map(statuses.map((s) => [s.id, s]))

  const { data } = await supabase
    .from('payment_milestones')
    .select('id, title, amount, status, paid_amount, trigger_status_id, projects(id, title, status_id, clients(name))')
    .order('created_at', { ascending: false })

  // Phase 9 + 9b - "תשלומים" (לשעבר "גביות") - חלק 1: מה שעדיין לא שולם במלואו
  // (pending/requested/partial). ללא קשר לאיזה סטטוס תיק מוגדר כ"גלוי בגביות" -
  // כל חוב פתוח מוצג תמיד.
  const milestones: MilestoneRow[] = (data ?? [])
    .filter((m: any) => m.status !== 'paid')
    .map((m: any) => {
      const trigger = m.trigger_status_id ? statusById.get(m.trigger_status_id) : undefined
      return {
        id: m.id,
        title: m.title,
        amount: m.amount,
        status: m.status,
        paid_amount: m.paid_amount ?? 0,
        project_id: m.projects?.id ?? '',
        project_title: m.projects?.title ?? '-',
        client: m.projects?.clients?.name ?? '-',
        trigger_status_label: trigger?.label ?? null,
        trigger_status_color: trigger?.color ?? null,
      }
    })

  // חלק 2: תיעוד של מה ששולם במלואו בפועל
  const paidMilestones: PaidMilestoneRow[] = (data ?? [])
    .filter((m: any) => m.status === 'paid')
    .map((m: any) => ({
      id: m.id,
      title: m.title,
      amount: m.amount,
      status: m.status,
      paid_amount: m.paid_amount ?? 0,
      project_id: m.projects?.id ?? '',
      project_title: m.projects?.title ?? '-',
      client: m.projects?.clients?.name ?? '-',
    }))

  // Phase 9c ("גביות עתידיות") - כל הצעות המחיר שאושרו (payment_milestones נוצר
  // רק באישור הצעה, אז כל שורה כאן כבר שייכת להצעה מאושרת), פחות מה ששולם
  // ופחות מה ששולם חלקית. אותו נתון בדיוק כמו הסכום הפתוח בטבלה למטה, מקובץ
  // לפי תיק לצורך הפירוט.
  const futureTotal = milestones.reduce((sum, m) => sum + outstanding(m), 0)
  const futureByProject = new Map<string, FutureCollectionRow>()
  for (const m of milestones) {
    const existing = futureByProject.get(m.project_id)
    if (existing) existing.amount += outstanding(m)
    else
      futureByProject.set(m.project_id, {
        project_id: m.project_id,
        project_title: m.project_title,
        client: m.client,
        amount: outstanding(m),
      })
  }
  const futureRows = Array.from(futureByProject.values()).sort((a, b) => b.amount - a.amount)

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-2">תשלומים</h1>
      <p className="text-sm text-gray-500 mb-4">
        שנו את הסטטוס ישירות מהרשימה - &quot;נדרש תשלום&quot; מסומן אוטומטית ברגע שהתיק מגיע
        לשלב המתאים ומדליק התראה בדשבורד. &quot;שולם חלקית&quot; דורש גם להקליד כמה שולם בפועל.
        תיק עם כמה שלבים פתוחים מוצג כשורה אחת מתקפלת - לחצו עליה כדי לראות את הפירוט.
      </p>

      <FutureCollectionsSummary total={futureTotal} rows={futureRows} />

      <h2 className="text-lg font-semibold mb-2">⏳ ממתין לתשלום</h2>
      <CollectionsTable milestones={milestones} />

      <h2 className="text-lg font-semibold mt-8 mb-2">✅ שולם</h2>
      <PaidPaymentsList milestones={paidMilestones} />
    </AppShell>
  )
}
