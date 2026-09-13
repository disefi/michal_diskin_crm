-- ============================================================
-- Phase 6h: מספר הצעה = מספר תיק, ותצוגת חישוב תשלומים
-- ============================================================

-- מספר הצעה כבר לא נוצר בנפרד - הוא תמיד זהה למספר התיק. מכיוון שלתיק
-- יכולות להיות כמה גרסאות הצעה (revise יוצר שורה חדשה), אי אפשר לשמור על
-- ייחודיות quote_number בין גרסאות - מסירים את האילוץ.
alter table quotes drop constraint if exists quotes_quote_number_key;

-- תיבת סימון: להציג פירוט חישוב סכומים בפועל לכל שלב תשלום (במקום רק אחוזים)
alter table quotes add column if not exists show_payment_calculation boolean not null default false;
