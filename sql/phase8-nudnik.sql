-- ==========================================
-- Phase 8: מערכת "נודניק" - התראה על תיקים תקועים
-- ==========================================

-- כמה ימים בסטטוס נתון נחשבים "תקוע" - NULL = אין בדיקה לסטטוס הזה
alter table project_statuses add column if not exists stale_after_days integer;

-- מתי שונה status_id בפועל בפעם האחרונה (לא updated_at הכללי, כי הוא מתעדכן גם בעריכות אחרות)
alter table projects add column if not exists status_changed_at timestamptz default now();

-- backfill לתיקים קיימים - מניחים שהשינוי האחרון היה updated_at (הכי קרוב שיש)
update projects set status_changed_at = updated_at where status_changed_at is null;

-- אין טבלה חדשה כאן, אז אין צורך ב-disable RLS נוסף - שתי הטבלאות כבר קיימות וללא RLS
