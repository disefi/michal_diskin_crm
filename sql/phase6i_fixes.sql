-- phase6i_fixes.sql
-- תיקון: RLS חסם insert לטבלאות quote_scope_items ו-quote_payment_terms
-- (אותה תבנית באג שחזרה כמה פעמים ב-Phase 6: טבלה חדשה מקבלת RLS דלוק
-- אוטומטית בלי policies, מה שחוסם את כל ה-insert בשקט).
-- קובץ זה שוחזר לפי התיעוד ב-PROJECT_SPEC.md, כי הקובץ המקורי לא אותר.
-- אם הרצת כבר בעבר קובץ זהה בתוכן - להריץ שוב לא מזיק (disable RLS הוא אידמפוטנטי).

alter table quote_scope_items disable row level security;
alter table quote_payment_terms disable row level security;
