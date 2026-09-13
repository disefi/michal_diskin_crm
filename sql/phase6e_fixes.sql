-- ============================================================
-- Phase 6e: בולטים קבועים להצעה, תנאי תשלום, וחיבור אוטומטי לגביות
-- להריץ ב-Supabase SQL Editor אחרי phase6d_fixes.sql
-- ============================================================

-- שדה "לכבוד" ניתן לעריכה נפרדת לכל הצעה (ברירת מחדל: שם הלקוח, ניתן להחלפה)
alter table quotes add column if not exists recipient_name text;

-- "העבודה תכלול" - בולטים המוצגים ללקוח, נפרדים משורות התמחור הפנימיות (quote_items)
create table if not exists quote_scope_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade not null,
  description text not null,
  sort_order int default 0
);
alter table quote_scope_items disable row level security;

-- "אופן תשלום" - אחוז + תנאי, לכל הצעה. משמש ליצירת שלבי גבייה אוטומטית באישור ההצעה
create table if not exists quote_payment_terms (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade not null,
  percentage numeric(5,2) not null,
  description text not null,
  sort_order int default 0
);
alter table quote_payment_terms disable row level security;

-- קישור שלבי גבייה (payment_milestones, מ-Phase 3) להצעה שיצרה אותם,
-- ודגל שמסמן שהתנאי בפועל התקיים ("בוצע - לדרוש תשלום")
alter table payment_milestones add column if not exists quote_id uuid references quotes(id);
alter table payment_milestones add column if not exists condition_met boolean not null default false;
alter table payment_milestones add column if not exists condition_met_at timestamptz;
