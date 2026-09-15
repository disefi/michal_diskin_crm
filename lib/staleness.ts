import { ProjectStatus } from './constants'

/** כמה ימים מלאים עברו מאז status_changed_at */
export function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  const changed = new Date(dateStr).getTime()
  const now = Date.now()
  return Math.floor((now - changed) / (1000 * 60 * 60 * 24))
}

export type StaleInfo = {
  /** האם הסף (stale_after_days) נחצה, בלי קשר לדחייה */
  thresholdExceeded: boolean
  /** כמה ימים בפועל בסטטוס הנוכחי */
  days: number
  /** האם התיק כרגע בדחייה (stale_snoozed_until עדיין בעתיד) */
  isSnoozed: boolean
  /** האם התיק צריך להופיע ברשימת ההתראות בדשבורד - תיק בדחייה תמיד לא מופיע שם */
  showInAlerts: boolean
  /** האם להציג את התג 🐌 בטבלאות/עמוד התיק - תלוי גם בהגדרה hideBadgeWhileSnoozed */
  showBadge: boolean
}

/**
 * "נודניק" (Phase 8 + 8b) - קובע אם תיק נחשב "תקוע" בסטטוס הנוכחי שלו, ואיך
 * להציג את זה בהתחשב בדחייה (snooze). תיק בארכיון (visible_in כולל 'archive')
 * אף פעם לא נחשב תקוע. סטטוס בלי stale_after_days מוגדר (null) - אף פעם לא מדליק התראה.
 */
export function getStaleInfo(
  statusId: string | null,
  statusChangedAt: string | null,
  snoozedUntil: string | null,
  statuses: ProjectStatus[],
  hideBadgeWhileSnoozed: boolean
): StaleInfo {
  const status = statuses.find((s) => s.id === statusId)
  const notApplicable = { thresholdExceeded: false, days: 0, isSnoozed: false, showInAlerts: false, showBadge: false }

  if (!status || status.visible_in.includes('archive') || status.stale_after_days == null) {
    return notApplicable
  }

  const days = getDaysSince(statusChangedAt)
  const thresholdExceeded = days >= status.stale_after_days
  if (!thresholdExceeded) return notApplicable

  const isSnoozed = !!snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()

  return {
    thresholdExceeded,
    days,
    isSnoozed,
    showInAlerts: !isSnoozed,
    showBadge: !(isSnoozed && hideBadgeWhileSnoozed),
  }
}
