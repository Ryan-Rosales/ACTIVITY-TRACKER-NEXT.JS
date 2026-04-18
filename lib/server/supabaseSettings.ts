import { mapSettingsRow, type SettingsRow } from "@/lib/server/mappers";

type SettingsUpsertInput = {
  ownerEmail: string;
  displayName: string;
  email: string;
  avatar: string | null;
  themeMode: "system" | "light" | "dark";
  sidebarCollapsed: boolean;
  accent: "violet" | "teal" | "sunset" | "emerald" | "rose";
  overdueAlerts: boolean;
  aiReminders: boolean;
  weeklySummary: boolean;
  twoFactorEnabled: boolean;
};

const getConfig = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase settings fallback is not configured.");
  }

  return { url, serviceRoleKey };
};

const headers = (serviceRoleKey: string) => ({
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
});

const toMappedSettings = (row: unknown) => mapSettingsRow(row as SettingsRow);

export async function fetchSettingsViaRest(ownerEmail: string) {
  const { url, serviceRoleKey } = getConfig();
  const endpoint = `${url}/rest/v1/app_settings?owner_email=eq.${encodeURIComponent(ownerEmail)}&limit=1`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      ...headers(serviceRoleKey),
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase settings read failed (${response.status}): ${text || "Unknown error"}`);
  }

  const rows = (await response.json()) as unknown[];
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return toMappedSettings(rows[0]);
}

export async function upsertSettingsViaRest(input: SettingsUpsertInput) {
  const { url, serviceRoleKey } = getConfig();
  const endpoint = `${url}/rest/v1/app_settings?on_conflict=owner_email&select=*`;

  const payload = [
    {
      owner_email: input.ownerEmail,
      display_name: input.displayName,
      email: input.email,
      avatar: input.avatar,
      theme_mode: input.themeMode,
      sidebar_collapsed: input.sidebarCollapsed,
      accent: input.accent,
      overdue_alerts: input.overdueAlerts,
      ai_reminders: input.aiReminders,
      weekly_summary: input.weeklySummary,
      two_factor_enabled: input.twoFactorEnabled,
    },
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers(serviceRoleKey),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase settings upsert failed (${response.status}): ${text || "Unknown error"}`);
  }

  const rows = (await response.json()) as unknown[];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Supabase settings upsert returned no rows.");
  }

  return toMappedSettings(rows[0]);
}
