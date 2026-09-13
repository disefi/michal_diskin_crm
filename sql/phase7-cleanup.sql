-- phase7-cleanup.sql
-- ============================================================
-- אל תריץ את הקובץ הזה עד שבדקת בפועל, במשך כמה ימים, שהכל עובד
-- תקין עם status_id החדש: יצירת תיק, שינוי סטטוס (inline וגם דרך
-- הטופס המלא), התצוגה ב-/projects /in-progress /archive /dashboard
-- /collections, והאוטומציה שמסמנת "התקיים" אוטומטית כשסטטוס תיק
-- תואם לתגית על שורת תשלום.
--
-- לאחר ההרצה של הקובץ הזה אין דרך חזרה בלחיצת כפתור - העמודה הישנה
-- וה-enum נמחקים לצמיתות. אם יש לך גיבוי/snapshot ב-Supabase, זה
-- הזמן לוודא שהוא קיים ותקין לפני ההרצה.
-- ============================================================

-- שלב 1: לוודא שאין אף פרויקט בלי status_id (אמור כבר להיות 0 מאז phase7a,
-- אבל אם נוצרו תיקים חדשים בינתיים בלי status_id בגלל קוד ישן/לא ממוזג - זה יתפוס את זה)
-- הרץ קודם ידנית, ורק אם התוצאה 0 - המשך לשלבים הבאים:
--   select count(*) from projects where status_id is null;

-- שלב 2: הסרת ברירת המחדל שהעמודה הישנה מחזיקה (אם יש), כדי שאפשר יהיה למחוק את סוג ה-enum בסוף
alter table projects alter column status drop default;

-- שלב 3: מחיקת העמודה הישנה
alter table projects drop column if exists status;

-- שלב 4: מחיקת סוג ה-enum הקבוע project_status עצמו (רק אחרי שאין יותר שום
-- עמודה שמשתמשת בו - אם ההרצה נכשלת כאן עם שגיאת "type is still in use",
-- סימן שנשאר מקום אחר שמשתמש בו שלא זיהינו, ואסור להמשיך)
drop type if exists project_status;

-- שלב 5 (רשות, לא חובה) - ניקוי עמודת legacy_key ב-project_statuses, ששימשה
-- רק למיפוי החד-פעמי ב-phase7a ואין בה שימוש בקוד מעבר לזה
-- alter table project_statuses drop column if exists legacy_key;

-- בדיקת שפיות סופית - שני השאילתות האלה חייבות לרוץ בלי שגיאה ולהחזיר תוצאות תקינות:
--   select status_id from projects limit 5;
--   select column_name from information_schema.columns where table_name = 'projects' and column_name = 'status';
--   (השאילתה השנייה אמורה להחזיר 0 שורות - העמודה כבר לא קיימת)
