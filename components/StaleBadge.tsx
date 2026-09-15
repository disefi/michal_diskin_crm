/**
 * תג קטן "🐌 תקוע X ימים" - מוצג ליד הסטטוס בכל מקום שמציג תיק
 * (ProjectsTable, ProjectDetail). לא מרנדר כלום אם התיק לא תקוע.
 */
export default function StaleBadge({ stale, days }: { stale: boolean; days: number }) {
  if (!stale) return null
  return (
    <span
      title={`ללא שינוי סטטוס כבר ${days} ימים`}
      className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full whitespace-nowrap"
    >
      🐌 תקוע {days} ימים
    </span>
  )
}
