import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWithUserContext } from "@/lib/server/db";
import { mapSettingsRow } from "@/lib/server/mappers";
import { fetchSettingsViaRest, upsertSettingsViaRest } from "@/lib/server/supabaseSettings";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let profile = null;

  try {
    profile = await runWithUserContext(email, async (client) => {
      const result = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [email]);
      return result.rows[0] ? mapSettingsRow(result.rows[0]) : null;
    });
  } catch {
    profile = await fetchSettingsViaRest(email);
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  try {
    const ownerEmail = await getEmail();
    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized: No email cookie found" }, { status: 401 });
    }

    const body = await request.json();

    // Validate avatar size if provided (limit to 1MB)
    if (body.avatar && typeof body.avatar === "string" && body.avatar.length > 1_000_000) {
      return NextResponse.json({ error: "Avatar image is too large. Maximum size is 1MB." }, { status: 400 });
    }

    let profile = null;

    try {
      profile = await runWithUserContext(ownerEmail, async (client) => {
        const currentResult = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [ownerEmail]);
        const current = currentResult.rows[0];

        const displayName = body.displayName ?? current?.display_name ?? ownerEmail.split("@")[0]?.replace(/\./g, " ") ?? "User";
        const email = body.email ?? current?.email ?? ownerEmail;
        const avatar = body.avatar !== undefined ? body.avatar : (current?.avatar ?? null);

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
            updated_at = now()
          returning *`,
          [
            ownerEmail,
            displayName,
            email,
            avatar,
            current?.theme_mode ?? "dark",
            current?.sidebar_collapsed ?? false,
            current?.accent ?? "violet",
            current?.overdue_alerts ?? true,
            current?.ai_reminders ?? true,
            current?.weekly_summary ?? false,
            current?.two_factor_enabled ?? false,
          ],
        );

        return mapSettingsRow(result.rows[0]);
      });
    } catch {
      const current = await fetchSettingsViaRest(ownerEmail);
      const displayName = body.displayName ?? current?.displayName ?? ownerEmail.split("@")[0]?.replace(/\./g, " ") ?? "User";
      const email = body.email ?? current?.email ?? ownerEmail;
      const avatar = body.avatar !== undefined ? body.avatar : (current?.avatar ?? null);

      profile = await upsertSettingsViaRest({
        ownerEmail,
        displayName,
        email,
        avatar,
        themeMode: current?.themeMode ?? "dark",
        sidebarCollapsed: current?.sidebarCollapsed ?? false,
        accent: current?.accent ?? "violet",
        overdueAlerts: current?.overdueAlerts ?? true,
        aiReminders: current?.aiReminders ?? true,
        weeklySummary: current?.weeklySummary ?? false,
        twoFactorEnabled: current?.twoFactorEnabled ?? false,
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Unable to save profile right now. Please try again." }, { status: 500 });
  }
}
