-- ============================================================
-- Phase 6f: פרופיל עסק (לוגו/חתימה/פרטי קשר) + Storage ל-PDF
-- להריץ ב-Supabase SQL Editor אחרי phase6e_fixes.sql
-- ============================================================

-- טבלת הגדרה יחידה - פרטי העסק שמופיעים בכותרת ובחתימת ההצעה
create table if not exists business_profile (
  id boolean primary key default true,
  business_name text,
  subtitle text,
  email text,
  phone1 text,
  phone2 text,
  business_number text,
  logo_url text,
  signature_url text,
  terms_text text,
  constraint business_profile_single_row check (id = true)
);

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

alter table business_profile disable row level security;

-- Storage bucket ציבורי לקריאה (לוגו + חתימה), עם הרשאת כתיבה למשתמשים מחוברים בלבד
insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

create policy "authenticated can upload business assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'business-assets');

create policy "authenticated can update business assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'business-assets');

create policy "authenticated can delete business assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'business-assets');

create policy "public can view business assets"
  on storage.objects for select
  using (bucket_id = 'business-assets');
