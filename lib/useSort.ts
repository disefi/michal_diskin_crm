'use client'
import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

/**
 * הוק מיון גנרי לטבלאות - שומר את מפתח המיון והכיוון, ומחזיר מערך ממוין.
 * משמש בכל טבלה שצריכה מיון לחיצה על כותרות עמודות (ProjectsTable, QuotesTable, ClientsTable).
 */
export function useSort<T extends Record<string, any>>(
  data: T[],
  initialKey: string | null = null,
  initialDir: SortDirection = 'asc'
) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey)
  const [sortDir, setSortDir] = useState<SortDirection>(initialDir)

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    const copy = [...data]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return av - bv
      return String(av).localeCompare(String(bv), 'he')
    })
    if (sortDir === 'desc') copy.reverse()
    return copy
  }, [data, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggleSort }
}
