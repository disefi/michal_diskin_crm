import Link from 'next/link'

const LINKS = [
  { href: '/dashboard', label: 'דשבורד', icon: '🏠' },
  { href: '/clients', label: 'לקוחות', icon: '👥' },
  { href: '/projects', label: 'תיקים', icon: '📁' },
  { href: '/quotes', label: 'הצעות מחיר', icon: '📄' },
  { href: '/in-progress', label: 'בביצוע', icon: '🛠️' },
  { href: '/collections', label: 'תשלומים', icon: '💰' },
  { href: '/archive', label: 'ארכיון', icon: '🗄️' },
  { href: '/settings', label: 'הגדרות', icon: '⚙️' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-l h-screen sticky top-0 flex flex-col p-4 shrink-0">
      <div className="font-bold text-lg mb-6 px-2">CRM מיגון</div>
      <nav className="flex flex-col gap-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}