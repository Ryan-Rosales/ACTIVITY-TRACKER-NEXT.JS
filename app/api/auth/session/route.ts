import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/server/supabaseAuth";
import { runWithUserContext } from "@/lib/server/db";
import { mapSettingsRow } from "@/lib/server/mappers";
import { fetchSettingsViaRest, upsertSettingsViaRest } from "@/lib/server/supabaseSettings";

export async function GET() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 401 });

  const user = await getSupabaseUser(token);
  if (!user?.email) return NextResponse.json({ user: null }, { status: 401 });

  const normalizedEmail = user.email.toLowerCase();
  let profile:
    | {
        displayName?: string;
        email?: string;
        avatar?: string;
      }
    | null = null;

  try {
    profile = await runWithUserContext(normalizedEmail, async (client) => {
      const defaultDisplayName = user.user_metadata?.full_name ?? normalizedEmail.split("@")[0] ?? "User";

      await client.query(
        `insert into public.app_settings (
          owner_email,
          display_name,
          email,
          avatar,
          theme_mode,
          sidebar_collapsed,
          accent,
          overdue_alerts,
          ai_reminders,
          weekly_summary,
          two_factor_enabled
        ) values ($1, $2, $3, null, 'dark', false, 'violet', true, true, false, false)
        on conflict (owner_email) do nothing`,
        [normalizedEmail, defaultDisplayName, normalizedEmail],
      );

      const result = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [normalizedEmail]);
      return result.rows[0] ? mapSettingsRow(result.rows[0]) : null;
    });
  } catch {
    try {
      const existing = await fetchSettingsViaRest(normalizedEmail);
      if (existing) {
        profile = existing;
      } else {
        const defaultDisplayName = user.user_metadata?.full_name ?? normalizedEmail.split("@")[0] ?? "User";
        profile = await upsertSettingsViaRest({
          ownerEmail: normalizedEmail,
          displayName: defaultDisplayName,
          email: normalizedEmail,
          avatar: null,
          themeMode: "dark",
          sidebarCollapsed: false,
          accent: "violet",
          overdueAlerts: true,
          aiReminders: true,
          weeklySummary: false,
          twoFactorEnabled: false,
        });
      }
    } catch {
      // Keep auth session functional even if all profile settings reads fail.
    }
  }

  const response = NextResponse.json({
    user: {
      email: profile?.email ?? normalizedEmail,
      name: profile?.displayName ?? user.user_metadata?.full_name ?? normalizedEmail.split("@")[0] ?? "User",
      avatar: profile?.avatar ?? null,
    },
  });

  response.cookies.set("activity_user_email", normalizedEmail, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
