import AppShell from '@/components/AppShell'
import Link from 'next/link'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <AppShell>
      <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">← חזרה לדשבורד</Link>
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400 mt-4">
        עמוד התיק (מזהה: {id}) ייבנה ב-Phase 5 - כרגע זה placeholder בלבד
      </div>
    </AppShell>
  )
}