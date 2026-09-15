import Link from 'next/link'
import MilestoneStatusControl from './MilestoneStatusControl'

export type PaidMilestoneRow = {
  id: string
  title: string
  amount: number
  status: string
  paid_amount: number
  project_id: string
  project_title: string
  client: string
}

/**
 * "תשלומים" (Phase 9 + 9b) - חלק שני: תיעוד של מה ששולם במלואו. בלי קיבוץ
 * (זו רשימה היסטורית, לא רשימת פעולות) - אבל אפשר לתקן סטטוס בטעות דרך אותה
 * בקרה משותפת שמשמשת גם למעלה.
 */
export default function PaidPaymentsList({ milestones }: { milestones: PaidMilestoneRow[] }) {
  if (milestones.length === 0) {
    return <p className="text-gray-400 text-sm">אין עדיין תשלומים שבוצעו</p>
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-gray-100 text-sm text-gray-600">
          <tr>
            <th className="p-3">שלב</th>
            <th className="p-3">תיק</th>
            <th className="p-3">לקוח</th>
            <th className="p-3">סכום</th>
            <th className="p-3">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map((m) => (
            <tr key={m.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{m.title}</td>
              <td className="p-3">
                <Link href={`/projects/${m.project_id}`} className="hover:underline">
                  {m.project_title}
                </Link>
              </td>
              <td className="p-3">{m.client}</td>
              <td className="p-3">₪{Number(m.amount).toLocaleString()}</td>
              <td className="p-3">
                <MilestoneStatusControl id={m.id} status={m.status} amount={m.amount} paidAmount={m.paid_amount} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
