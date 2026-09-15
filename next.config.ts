import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // מבטל את ה-Client-side Router Cache לעמודים דינמיים, כדי שכל ניווט (לא
    // רק F5) ימשוך תמיד את המידע העדכני מהשרת. חשוב לכל מסך שמושפע מ-Server
    // Actions (סטטוס תיק, גבייה, נודניק וכו') - נכונות המידע לפני ביצועים,
    // בטוח לגמרי לכמות המשתמשים הנוכחית.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
