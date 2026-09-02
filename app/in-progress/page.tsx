import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'

export default async function InProgressPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, title, address, clients(name)')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })

  const projects = data ?? []

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">בביצוע</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr><th className="p-3">פרויקט</th><th className="p-3">לקוח</th><th className="p-3">כתובת</th></tr>
          </thead>
          <tbody>
            {projects.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.title}</td>
                <td className="p-3">{p.clients?.name ?? '-'}</td>
                <td className="p-3">{p.address ?? '-'}</td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-gray-400">אין פרויקטים בביצוע</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}