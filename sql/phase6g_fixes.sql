-- ============================================================
-- Phase 6g: תיקון סדר פקודות (RLS על business_profile) + תנאים לכל הצעה בנפרד
-- ============================================================

-- תיקון הבאג: ה-INSERT הראשוני נחסם על ידי RLS לפני שהספקנו לכבות אותו.
-- זה בטוח להריץ גם אם הטבלה כבר קיימת.
alter table business_profile disable row level security;

-- אם השורה הראשונית מעולם לא נוצרה בגלל השגיאה, ניצור אותה עכשיו
insert into business_profile (id, business_name, subtitle, email, phone1, phone2, business_number, terms_text)
values (
  true,
  'מיכל דיסקין',
  'יועצת מיגון',
  'michalwin434@gmail.com',
  '051-2213314',
  '052-7699434',
  '313120172',
  'המחירים אינם כוללים מע"מ.
הצעה זו תקפה ל-60 יום.
כל שינוי שיבוצע לאחר העלאה למערכת של פקע"ר, יתומחר בנפרד.'
)
on conflict (id) do nothing;

-- תנאים כלליים ניתנים לעריכה בנפרד לכל הצעה (ברירת מחדל: התנאים מההגדרות, ניתן לשנות)
alter table quotes add column if not exists terms_text text;
