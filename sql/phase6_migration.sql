-- ============================================================
-- Phase 6 Migration: מספרי תיק + מספרי הצעת מחיר
-- להריץ ב-Supabase SQL Editor על הפרויקט (nqcbulblhqeljylpqcgz)
-- ============================================================

-- 1) עמודת מספר תיק על טבלת הפרויקטים
alter table projects add column if not exists case_number text unique;

-- 2) הגדרות נקודת התחלה למספור תיקים, לפי שנה (נערך דרך מסך ההגדרות)
create table if not exists case_number_settings (
  year int primary key,
  start_number int not null default 1,
  updated_at timestamptz not null default now()
);

-- 3) מונה אמיתי של מספרי תיק שהונפקו, לפי שנה - מתעדכן אטומית ב-DB
create table if not exists case_number_counters (
  year int primary key,
  last_number int not null default 0
);

-- 4) פונקציה ליצירת מספר תיק חדש - אטומית (בטוחה מול קריאות מקבילות),
--    מכבדת את נקודת ההתחלה שהוגדרה בהגדרות (או 1 כברירת מחדל)
create or replace function generate_case_number(p_year int)
returns text
language plpgsql
as $$
declare
  v_start int;
  v_next int;
begin
  select coalesce(start_number, 1) into v_start
  from case_number_settings where year = p_year;

  if v_start is null then
    v_start := 1;
  end if;

  insert into case_number_counters (year, last_number)
  values (p_year, v_start - 1)
  on conflict (year) do nothing;

  update case_number_counters
  set last_number = last_number + 1
  where year = p_year
  returning last_number into v_next;

  return p_year || '-' || lpad(v_next::text, 3, '0');
end;
$$;

-- 5) מונה מספרי הצעת מחיר, לפי שנה (בפורמט Q-2026-0001, ללא הגדרת נקודת התחלה)
create table if not exists quote_number_counters (
  year int primary key,
  last_number int not null default 0
);

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

  return 'Q-' || p_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- 6) מיגרציה חד-פעמית: הקצאת מספרי תיק רטרואקטיבית לפרויקטים קיימים (מ-Phase 3 seed)
--    שנוצרו לפני הפיצ'ר הזה - לפי סדר created_at, כל אחד מקבל מספר עוקב לשנה שלו.
do $$
declare
  proj record;
  yr int;
begin
  for proj in select id, created_at from projects where case_number is null order by created_at asc loop
    yr := extract(year from proj.created_at);
    update projects set case_number = generate_case_number(yr) where id = proj.id;
  end loop;
end $$;
