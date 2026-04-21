import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWithUserContext } from "@/lib/server/db";
import { mapSettingsRow } from "@/lib/server/mappers";
import { fetchSettingsViaRest, upsertSettingsViaRest } from "@/lib/server/supabaseSettings";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

const isDatabaseUnavailableError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("ENOTFOUND") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("DATABASE_URL")
  );
};

const errorResponse = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown server error";
  return NextResponse.json(
    {
      error: "Failed to process settings request.",
      details: process.env.NODE_ENV === "production" ? undefined : message,
    },
    { status: 500 },
  );
};

const mergedSettingsPayload = (
  email: string,
  body: Record<string, unknown>,
  current: {
    displayName?: string;
    email?: string;
    avatar?: string;
    themeMode?: "system" | "light" | "dark";
    sidebarCollapsed?: boolean;
    accent?: "violet" | "teal" | "sunset" | "emerald" | "rose";
    overdueAlerts?: boolean;
    aiReminders?: boolean;
    weeklySummary?: boolean;
    twoFactorEnabled?: boolean;
  } | null,
) => ({
  displayName: (body.displayName as string | undefined) ?? current?.displayName ?? email.split("@")[0]?.replace(/\./g, " ") ?? "User",
  email: (body.email as string | undefined) ?? current?.email ?? email,
  avatar: (body.avatar as string | null | undefined) ?? current?.avatar ?? null,
  themeMode: (body.themeMode as "system" | "light" | "dark" | undefined) ?? current?.themeMode ?? "dark",
  sidebarCollapsed: (body.sidebarCollapsed as boolean | undefined) ?? current?.sidebarCollapsed ?? false,
  accent: (body.accent as "violet" | "teal" | "sunset" | "emerald" | "rose" | undefined) ?? current?.accent ?? "violet",
  overdueAlerts: (body.overdueAlerts as boolean | undefined) ?? current?.overdueAlerts ?? true,
  aiReminders: (body.aiReminders as boolean | undefined) ?? current?.aiReminders ?? true,
  weeklySummary: (body.weeklySummary as boolean | undefined) ?? current?.weeklySummary ?? false,
  twoFactorEnabled: (body.twoFactorEnabled as boolean | undefined) ?? current?.twoFactorEnabled ?? false,
});

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await runWithUserContext(email, async (client) => {
      const result = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [email]);
      return result.rows[0] ? mapSettingsRow(result.rows[0]) : null;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const settings = await fetchSettingsViaRest(email);
      return NextResponse.json({ settings });
    }

    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const settings = await runWithUserContext(email, async (client) => {
      const currentResult = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [email]);
      const current = currentResult.rows[0]
        ? mapSettingsRow(currentResult.rows[0])
        : null;

      const merged = mergedSettingsPayload(email, body, current);

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
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const current = await fetchSettingsViaRest(email);
      const merged = mergedSettingsPayload(email, body, current);
      const settings = await upsertSettingsViaRest({
        ownerEmail: email,
        displayName: merged.displayName,
        email: merged.email,
        avatar: merged.avatar,
        themeMode: merged.themeMode,
        sidebarCollapsed: merged.sidebarCollapsed,
        accent: merged.accent,
        overdueAlerts: merged.overdueAlerts,
        aiReminders: merged.aiReminders,
        weeklySummary: merged.weeklySummary,
        twoFactorEnabled: merged.twoFactorEnabled,
      });

      return NextResponse.json({ settings });
    }

    return errorResponse(error);
  }
}
