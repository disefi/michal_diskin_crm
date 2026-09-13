-- phase7a_project_statuses.sql
-- שלב 1 מתוך מערכת "סטטוסים דינמיים": יוצר טבלת project_statuses שמחליפה בהדרגה
-- את ה-enum הקבוע project_status. העמודה הישנה projects.status *לא* נמחקת כאן -
-- היא תישאר עד לאימות מלא שהקוד עובד עם status_id, ורק אז תימחק בסקריפט המשך
-- נפרד (phase7-cleanup, בהמשך). כך יש נתיב חזרה אם משהו לא עובד כמצופה.

create table project_statuses (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique, -- שומר את ערך ה-enum הישן, לצורך המיגרציה בלבד. לא בשימוש בקוד.
  label text not null,
  color text not null default 'bg-gray-100 text-gray-800', -- מחלקות Tailwind, כמו STATUS_COLORS הישן
  sort_order int not null default 0,
  is_active boolean not null default true, -- "כיבוי" סטטוס בלי למחוק, כדי לא לשבור תיקים ישנים שמשויכים אליו
  -- מקומות שבהם סטטוס זה אמור "להיות מוצג": כל שילוב של
  -- 'projects' | 'in_progress' | 'archive' | 'dashboard' | 'quotes' | 'collections'
  visible_in text[] not null default '{}',
  created_at timestamptz default now()
);

-- טבלה חדשה = RLS דולק אוטומטית בלי policies, מה שחוסם insert/update בשקט (לקח חוזר מ-Phase 6)
alter table project_statuses disable row level security;

-- Seed: 7 השורות הקיימות היום, עם visible_in שממופה 1:1 להתנהגות הנוכחית בפועל -
-- כלומר אחרי הרצת הסקריפט הזה שום מסך לא אמור להיראות אחרת. שינוי בפועל של
-- "איפה כל סטטוס מוצג" ייעשה אחר כך דרך מסך ההגדרות, לא כאן.
insert into project_statuses (legacy_key, label, color, sort_order, visible_in) values
  ('new',         'חדש',          'bg-gray-100 text-gray-800',    0, array['projects','dashboard','quotes','collections']),
  ('in_review',   'בבדיקה',       'bg-yellow-100 text-yellow-800',1, array['projects','dashboard','quotes','collections']),
  ('quote_sent',  'הצעה נשלחה',   'bg-blue-100 text-blue-800',    2, array['projects','dashboard','quotes','collections']),
  ('approved',    'אושר',         'bg-purple-100 text-purple-800',3, array['projects','dashboard','quotes','collections']),
  ('in_progress', 'בביצוע',       'bg-orange-100 text-orange-800',4, array['projects','in_progress','dashboard','quotes','collections']),
  ('completed',   'הושלם',        'bg-green-100 text-green-800',  5, array['projects','archive','dashboard','quotes','collections']),
  ('cancelled',   'בוטל',         'bg-red-100 text-red-800',      6, array['projects','archive','dashboard','quotes','collections']);

-- עמודת status_id חדשה על projects - עדיין לצד status הישנה, לא במקומה
alter table projects add column if not exists status_id uuid references project_statuses(id);

update projects p
set status_id = ps.id
from project_statuses ps
where ps.legacy_key = p.status::text
  and p.status_id is null;

-- אותה תגית פנימית שדיברנו עליה - על שורת "אופן תשלום" בהצעה, ועל שלב הגבייה
-- שנוצר ממנה בפועל. שתי העמודות nullable בכוונה: תגית היא רשות, לא כל שורה
-- חייבת "לדרוש" סטטוס ספציפי.
alter table quote_payment_terms add column if not exists trigger_status_id uuid references project_statuses(id);
alter table payment_milestones add column if not exists trigger_status_id uuid references project_statuses(id);

-- בדיקת שפיות - להריץ בעצמך אחרי הסקריפט, התוצאה חייבת להיות 0:
-- select count(*) from projects where status_id is null;
