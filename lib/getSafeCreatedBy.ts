import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * מחזיר את מזהה המשתמש רק אם קיימת לו שורה בטבלת profiles - אחרת null.
 * מונע שגיאת foreign key (23503) כשמנסים לשמור created_by למשתמש שאין לו עדיין
 * פרופיל (למשל בסביבת פיתוח/משתמש טרי).
 */
export async function getSafeCreatedBy(
  supabase: SupabaseClient,
  userId: string | undefined | null
): Promise<string | null> {
  if (!userId) return null
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
  return data ? userId : null
}
