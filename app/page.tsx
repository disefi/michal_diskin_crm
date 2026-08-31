import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">חיבור ל-Supabase</h1>
      <p className="mt-2">
        {error ? `שגיאה: ${error.message}` : "החיבור עובד! ✅ (עדיין בלי טבלאות - זה תקין)"}
      </p>
    </main>
  );
}