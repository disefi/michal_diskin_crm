import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">CRM - ייעוץ מיגון</h1>
      <p className="mt-2">מחובר בתור: {user?.email}</p>

      <form action={logout} className="mt-4">
        <button type="submit" className="bg-gray-200 px-4 py-2 rounded">
          התנתק
        </button>
      </form>
    </main>
  );
}