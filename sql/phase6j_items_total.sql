-- phase6j_items_total.sql
-- עמודה חדשה לתיבת הסימון של חלק "שורות התמחור" (quote_items) בהצעה -
-- האם להוסיף שורת סיכום מחוברת מתחת לרשימת השורות כשיש 2+ שורות.
-- נפרד לגמרי מ-show_payment_calculation (ששייכת לחלק "אופן תשלום"/האחוזים).

alter table quotes add column if not exists show_items_total boolean not null default false;
