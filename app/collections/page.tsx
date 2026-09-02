import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_milestones')
    .select('id, title, amount, status, projects(title, clients(name))')
    .order('created_at', { ascending: false })

  const milestones = data ?? []

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-2">גביות</h1>
      <p className="text-sm text-gray-500 mb-4">
        זו תשתית בלבד - החיבור האוטומטי (יצירת דרישת תשלום בסיום שלב) ייבנה כשמסך הצעות המחיר יהיה מוכן.
      </p>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr><th className="p-3">שלב</th><th className="p-3">פרויקט</th><th className="p-3">לקוח</th><th className="p-3">סכום</th><th className="p-3">סטטוס</th></tr>
          </thead>
          <tbody>
            {milestones.map((m: any) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{m.title}</td>
                <td className="p-3">{m.projects?.title ?? '-'}</td>
                <td className="p-3">{m.projects?.clients?.name ?? '-'}</td>
                <td className="p-3">₪{m.amount}</td>
                <td className="p-3">{m.status}</td>
              </tr>
            ))}
            {milestones.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">אין נתוני גבייה עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}