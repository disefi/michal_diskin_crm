import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-lg shadow"
      >
        <h1 className="text-xl font-bold text-center">התחברות</h1>

        {params.error && (
          <p className="text-red-600 text-sm text-center">{params.error}</p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm mb-1">
            אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1">
            סיסמה
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 font-medium"
        >
          התחבר
        </button>
      </form>
    </main>
  );
}