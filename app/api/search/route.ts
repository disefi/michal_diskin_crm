import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ results: [] })

  const supabase = await createClient()

  const [{ data }, { data: statusesData }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, case_number, title, address, status_id, clients(name)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('project_statuses').select('id, label, color'),
  ])

  const statusMap = new Map((statusesData ?? []).map((s: any) => [s.id, s]))

  const term = q.toLowerCase()
  const results = (data ?? [])
    .filter(
      (p: any) =>
        p.title?.toLowerCase().includes(term) ||
        p.address?.toLowerCase().includes(term) ||
        p.clients?.name?.toLowerCase().includes(term)
    )
    .slice(0, 8)
    .map((p: any) => {
      const status = statusMap.get(p.status_id)
      return {
        id: p.id,
        case_number: p.case_number,
        title: p.title,
        client: p.clients?.name ?? '-',
        address: p.address,
        statusLabel: status?.label ?? null,
        statusColor: status?.color ?? 'bg-gray-100 text-gray-800',
      }
    })

  return NextResponse.json({ results })
}