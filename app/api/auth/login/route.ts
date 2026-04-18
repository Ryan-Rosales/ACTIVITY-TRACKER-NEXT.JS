import { NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/server/supabaseAuth";
import { runWithUserContext } from "@/lib/server/db";
import { mapSettingsRow } from "@/lib/server/mappers";
import { fetchSettingsViaRest, upsertSettingsViaRest } from "@/lib/server/supabaseSettings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    const remember = body.remember !== false;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await signInWithPassword(email, password);
    const normalizedEmail = result.user.email.toLowerCase();
    let profile:
      | {
          displayName?: string;
          email?: string;
          avatar?: string;
        }
      | null = null;

    try {
      profile = await runWithUserContext(normalizedEmail, async (client) => {
        const defaultDisplayName = result.user.user_metadata?.full_name ?? normalizedEmail.split("@")[0] ?? "User";

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

        const settingsResult = await client.query("select * from public.app_settings where owner_email = $1 limit 1", [normalizedEmail]);
        return settingsResult.rows[0] ? mapSettingsRow(settingsResult.rows[0]) : null;
      });
    } catch {
      try {
        const existing = await fetchSettingsViaRest(normalizedEmail);
        if (existing) {
          profile = existing;
        } else {
          const defaultDisplayName = result.user.user_metadata?.full_name ?? normalizedEmail.split("@")[0] ?? "User";
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
        // Fall back to auth metadata if profile settings are temporarily unavailable.
      }
    }

    const response = NextResponse.json({
      user: {
        email: profile?.email ?? normalizedEmail,
        name: profile?.displayName ?? result.user.user_metadata?.full_name ?? normalizedEmail.split("@")[0] ?? "User",
        avatar: profile?.avatar ?? null,
      },
    });

    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    response.cookies.set("auth_token", result.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    response.cookies.set("activity_user_email", normalizedEmail, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    if (message.toLowerCase().includes("email not confirmed")) {
      return NextResponse.json(
        {
          error: "Your email is not confirmed yet. Create the account again or contact support if this keeps happening.",
          requiresEmailConfirmation: true,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ error: message }, { status: 401 });
  }
}
