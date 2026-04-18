import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWithUserContext } from "@/lib/server/db";
import { mapSettingsRow } from "@/lib/server/mappers";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await runWithUserContext(email, async (client) => {
    const result = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [email]);
    return result.rows[0] ? mapSettingsRow(result.rows[0]) : null;
  });

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const settings = await runWithUserContext(email, async (client) => {
    const currentResult = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [email]);
    const current = currentResult.rows[0];
    const merged = {
      displayName: body.displayName ?? current?.display_name ?? email.split("@")[0]?.replace(/\./g, " ") ?? "User",
      email: body.email ?? current?.email ?? email,
      avatar: body.avatar ?? current?.avatar ?? null,
      themeMode: body.themeMode ?? current?.theme_mode ?? "dark",
      sidebarCollapsed: body.sidebarCollapsed ?? current?.sidebar_collapsed ?? false,
      accent: body.accent ?? current?.accent ?? "violet",
      overdueAlerts: body.overdueAlerts ?? current?.overdue_alerts ?? true,
      aiReminders: body.aiReminders ?? current?.ai_reminders ?? true,
      weeklySummary: body.weeklySummary ?? current?.weekly_summary ?? false,
      twoFactorEnabled: body.twoFactorEnabled ?? current?.two_factor_enabled ?? false,
    };

    const result = await client.query(
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
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      on conflict (owner_email) do update set
        display_name = excluded.display_name,
        email = excluded.email,
        avatar = excluded.avatar,
        theme_mode = excluded.theme_mode,
        sidebar_collapsed = excluded.sidebar_collapsed,
        accent = excluded.accent,
        overdue_alerts = excluded.overdue_alerts,
        ai_reminders = excluded.ai_reminders,
        weekly_summary = excluded.weekly_summary,
        two_factor_enabled = excluded.two_factor_enabled,
        updated_at = now()
      returning *`,
      [
        email,
        merged.displayName,
        merged.email,
        merged.avatar,
        merged.themeMode,
        merged.sidebarCollapsed,
        merged.accent,
        merged.overdueAlerts,
        merged.aiReminders,
        merged.weeklySummary,
        merged.twoFactorEnabled,
      ],
    );

    return mapSettingsRow(result.rows[0]);
  });

  return NextResponse.json({ settings });
}
