import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import ClientsTable from '@/components/ClientsTable'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, name, phone, email, address, notes')
    .order('name')

  const clients = data ?? []

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">לקוחות</h1>
      <ClientsTable clients={clients} />
    </AppShell>
  )
}
