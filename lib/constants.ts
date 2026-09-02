export const STATUS_LABELS: Record<string, string> = {
  new: 'חדש',
  in_review: 'בבדיקה',
  quote_sent: 'הצעה נשלחה',
  approved: 'אושר',
  in_progress: 'בביצוע',
  completed: 'הושלם',
  cancelled: 'בוטל',
}

export const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  quote_sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

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