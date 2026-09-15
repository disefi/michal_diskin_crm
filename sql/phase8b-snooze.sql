-- ==========================================
-- Phase 8b: דחיית התראת "נודניק" (snooze) + הגדרה גלובלית
-- ==========================================

-- עד מתי התיק "בדחייה" - כל עוד now() < stale_snoozed_until, התיק לא מופיע
-- ברשימת ההתראות בדשבורד, ללא קשר להגדרה למטה
alter table projects add column if not exists stale_snoozed_until timestamptz;

-- הגדרה גלובלית יחידה (שורה אחת, בדיוק כמו business_profile / quote_archive_settings):
-- האם דחייה גם מסתירה את התג 🐌 בטבלאות/עמוד התיק, או שהתג ממשיך להופיע תמיד
create table if not exists nudnik_settings (
  id boolean primary key default true,
  hide_badge_while_snoozed boolean not null default true,
  constraint nudnik_settings_singleton check (id)
);

alter table nudnik_settings disable row level security;

insert into nudnik_settings (id, hide_badge_while_snoozed)
values (true, true)
on conflict (id) do nothing;
