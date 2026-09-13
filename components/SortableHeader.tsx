'use client'

export default function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string
  sortKey: string
  currentKey: string | null
  currentDir: 'asc' | 'desc'
  onSort: (key: string) => void
}) {
  const active = currentKey === sortKey
  return (
    <th className="p-3 select-none">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 hover:text-gray-900 ${active ? 'text-gray-900 font-semibold' : ''}`}
      >
        {label}
        <span className="text-[10px] leading-none">
          {active ? (currentDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </button>
    </th>
  )
}
