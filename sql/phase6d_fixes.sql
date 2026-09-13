-- ============================================================
-- Phase 6d: הגדרת זמן להעברה אוטומטית לארכיון של הצעות מחיר
-- להריץ ב-Supabase SQL Editor אחרי phase6c_fixes.sql
-- ============================================================

-- טבלת הגדרה יחידה (שורה אחת בלבד, נאכף ב-constraint) - כמה חודשים אחרי יצירת
-- הצעת מחיר היא עוברת אוטומטית לארכיון (ברירת מחדל: 12 חודשים)
create table if not exists quote_archive_settings (
  id boolean primary key default true,
  months int not null default 12,
  constraint quote_archive_settings_single_row check (id = true)
);

insert into quote_archive_settings (id, months)
values (true, 12)
on conflict (id) do nothing;

alter table quote_archive_settings disable row level security;
