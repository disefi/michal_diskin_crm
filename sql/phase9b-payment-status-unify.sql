-- ==========================================
-- Phase 9b: איחוד "התקיים" (condition_met) לתוך שדה status יחיד + "שולם חלקית"
-- ==========================================

-- כמה כסף שולם בפועל עד כה - רלוונטי בעיקר לסטטוס 'partial'
alter table payment_milestones add column if not exists paid_amount numeric not null default 0;

-- status הוא שדה טקסט חופשי כבר (לא enum קשיח), הערכים החדשים בשימוש מעכשיו:
-- 'pending' (עוד לא הגיע הזמן) / 'requested' (נדרש תשלום) / 'partial' (שולם חלקית) / 'paid' (שולם)

-- מיגרציה חד-פעמית: שורות שכבר סומנו condition_met=true ידנית/אוטומטית אך
-- הסטטוס עדיין 'pending' - עוברות ל-'requested', כדי לשמר את הכוונה המקורית
-- ולא לאבד את ההתראות הקיימות בדשבורד
update payment_milestones
set status = 'requested'
where condition_met = true and status = 'pending';

-- הערה: העמודות condition_met / condition_met_at לא נמחקות בשלב הזה (לא הרסני,
-- אפשר תמיד לנקות אותן במיגרציית cleanup נפרדת בעתיד לאחר כמה ימי בדיקה יציבה,
-- באותה מתודולוגיה כמו phase7-cleanup.sql). הקוד מפסיק להשתמש בהן מעכשיו.
