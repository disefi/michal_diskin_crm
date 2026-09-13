-- ============================================================
-- Phase 6c: ארכיון אוטומטי להצעות מחיר בנות שנה+
-- להריץ ב-Supabase SQL Editor אחרי phase6_migration.sql ו-phase6b_fixes.sql
-- ============================================================

-- דגל: הצעה שהוצאה ידנית מהארכיון לא תוחזר אליו אוטומטית בגלל גיל
alter table quotes add column if not exists keep_active boolean not null default false;
