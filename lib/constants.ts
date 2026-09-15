export const URGENCY_LABELS: Record<string, string> = {
  normal: 'רגילה',
  urgent: 'דחופה',
  critical: 'קריטית',
}

export const URGENCY_COLORS: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-600',
  urgent: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה',
  sent: 'נשלחה',
  approved: 'אושרה',
  rejected: 'נדחתה',
  expired: 'פגה תוקף',
}

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-yellow-100 text-yellow-800',
}

/** בולטים ברירת מחדל ל"העבודה תכלול" בהצעה חדשה - ניתנים לעריכה מלאה לכל הצעה */
export const DEFAULT_SCOPE_ITEMS = [
  'ליווי, ייעוץ ומתן הנחיות לתקינות המרחב המוגן בקנ"מ 1:100',
  'תכנון ושרטוט המרחב המוגן בקנ"מ 1:50',
  'הגשה לפקע"ר עד לאישור',
]

/** השורה שמתווספת/מוסרת אוטומטית מ"העבודה תכלול" לפי תיבת הסימון "כולל קונסטרוקציה" */
export const CONSTRUCTION_LINE = 'הכנת נספח קונסטרוקציה'

/** ברירת מחדל לתנאים הכלליים בתחתית ההצעה, גם אם הגדרות העסק עדיין ריקות ב-DB */
export const DEFAULT_TERMS_TEXT = `המחירים אינם כוללים מע"מ.
הצעה זו תקפה ל - 60 יום.
כל שינוי שיבוצע לאחר העלאה למערכת של פקע"ר, יתומחר בנפרד.`

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין',
  requested: 'נדרש תשלום',
  partial: 'שולם חלקית',
  paid: 'שולם',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  requested: 'bg-orange-100 text-orange-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
}

// ==========================================
// מערכת סטטוסים דינמית (Phase 7) - project_statuses
// ==========================================

/**
 * המקומות שבהם סטטוס פרויקט יכול "להיות מוצג". זהה בדיוק לערכים שנשמרים
 * במערך visible_in בטבלת project_statuses. שינוי כאן (הוספת מקום חדש) דורש
 * תמיד גם התאמה בקוד הצריכה בפועל (למשל app/in-progress/page.tsx).
 */
export const VISIBLE_IN_OPTIONS = ['projects', 'in_progress', 'archive', 'dashboard', 'quotes', 'collections'] as const
export type VisibleInOption = (typeof VISIBLE_IN_OPTIONS)[number]

export const VISIBLE_IN_LABELS: Record<VisibleInOption, string> = {
  projects: 'כל הפרויקטים',
  in_progress: 'בביצוע',
  archive: 'ארכיון',
  dashboard: 'דשבורד',
  quotes: 'הצעות מחיר',
  collections: 'גבייה',
}

/** שורה אחת מטבלת project_statuses - הטיפוס המשותף שכל הקומפוננטות/עמודים משתמשים בו */
export type ProjectStatus = {
  id: string
  label: string
  color: string
  sort_order: number
  is_active: boolean
  visible_in: string[]
  /** Phase 8 ("נודניק") - כמה ימים בסטטוס הזה נחשבים "תקוע". null = אין בדיקה לסטטוס הזה */
  stale_after_days: number | null
}

/** Phase 8b - הגדרה גלובלית יחידה: האם דחיית התראת נודניק מסתירה גם את התג 🐌 */
export type NudnikSettings = {
  hide_badge_while_snoozed: boolean
}
