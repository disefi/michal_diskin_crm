import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, title, address, status, clients(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const term = q.toLowerCase()
  const results = (data ?? [])
    .filter(
      (p: any) =>
        p.title?.toLowerCase().includes(term) ||
        p.address?.toLowerCase().includes(term) ||
        p.clients?.name?.toLowerCase().includes(term)
    )
    .slice(0, 8)
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      client: p.clients?.name ?? '-',
      address: p.address,
      status: p.status,
    }))

  return NextResponse.json({ results })
}