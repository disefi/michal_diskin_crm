-- ============================================================
-- Phase 6b: תיקוני באגים + שינויים נוספים
-- להריץ ב-Supabase SQL Editor אחרי phase6_migration.sql
-- ============================================================

-- 1) תיקון: RLS נדלק אוטומטית על טבלאות חדשות וחוסם הכל בלי policies.
--    מכבים RLS על טבלאות התמיכה החדשות, בהתאם לשאר הסכימה שאין בה RLS.
alter table case_number_settings disable row level security;
alter table case_number_counters disable row level security;
alter table quote_number_counters disable row level security;

-- 2) פירוק כתובת הפרויקט לשדות נפרדים + איש קשר נוסף
alter table projects add column if not exists street text;
alter table projects add column if not exists house_number text; -- טקסט, כדי לאפשר טווח כמו "12-14"
alter table projects add column if not exists city text;
alter table projects add column if not exists address_note text; -- כותרת נוספת, רשות
alter table projects add column if not exists additional_contact text; -- משרד מלווה / איש קשר נוסף, רשות

-- 3) הצעות מחיר: דגל קונסטרוקציה פנימי + מנגנון גרסאות/ארכיון
alter table quotes add column if not exists includes_construction boolean not null default false;
alter table quotes add column if not exists archived_at timestamptz;

-- 4) תיקון פורמט מספר הצעת מחיר - בלי אות Q, רק מספרים (עקבי עם מספרי תיק)
create or replace function generate_quote_number(p_year int)
returns text
language plpgsql
as $$
declare
  v_next int;
begin
  insert into quote_number_counters (year, last_number)
  values (p_year, 0)
  on conflict (year) do nothing;

  update quote_number_counters
  set last_number = last_number + 1
  where year = p_year
  returning last_number into v_next;

  return p_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;
