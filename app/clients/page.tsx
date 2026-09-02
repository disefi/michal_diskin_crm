import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, name, phone, email, address')
    .order('name')

  const clients = data ?? []

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-1">לקוחות</h1>
      <p className="text-sm text-gray-500 mb-4">רשימה בלבד - הוספה/עריכה ייבנו ב-Phase 4</p>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr><th className="p-3">שם</th><th className="p-3">טלפון</th><th className="p-3">אימייל</th><th className="p-3">כתובת</th></tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{c.email ?? '-'}</td>
                <td className="p-3">{c.address ?? '-'}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">אין לקוחות עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}