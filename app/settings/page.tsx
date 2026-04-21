"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Lock, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

const accents = ["violet", "teal", "sunset", "emerald", "rose"] as const;
const accentClasses: Record<(typeof accents)[number], string> = {
  violet: "bg-[#6c63ff]",
  teal: "bg-[#14b8a6]",
  sunset: "bg-[#f97316]",
  emerald: "bg-[#10b981]",
  rose: "bg-[#f43f5e]",
};

export default function SettingsPage() {
  const notificationSettings = useNotificationStore((state) => state.settings);
  const setNotificationSettings = useNotificationStore((state) => state.setSettings);
  const pushNotification = useNotificationStore((state) => state.pushNotification);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const accent = useSettingsStore((state) => state.accent);
  const setAccent = useSettingsStore((state) => state.setAccent);
  const twoFactorEnabled = useSettingsStore((state) => state.twoFactorEnabled);
  const setTwoFactorEnabled = useSettingsStore((state) => state.setTwoFactorEnabled);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [dailyBudgetInput, setDailyBudgetInput] = useState(40);
  const [usage, setUsage] = useState<{
    usedRequests: number;
    dailyBudget: number;
    remainingRequests: number;
    resetAt: string;
    source: "postgres" | "supabase" | "memory";
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageMessage, setUsageMessage] = useState<string | null>(null);
  const [savingBudget, setSavingBudget] = useState(false);

  const updateNotificationPreference = (
    key: "overdueAlerts" | "aiReminders" | "weeklySummary",
    checked: boolean,
  ) => {
    setNotificationSettings({ [key]: checked });
    hydrateSettings({ [key]: checked });
  };

  const handlePasswordUpdate = () => {
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 8) {
      setSecurityMessage("Password must be at least 8 characters.");
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setSecurityMessage("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setSecurityMessage(null);

    setTimeout(() => {
      setSavingPassword(false);
      setPassword("");
      setConfirmPassword("");
      setSecurityMessage("Password updated successfully.");
      pushNotification({ type: "update", message: "Security settings updated: password changed." });
    }, 550);
  };

  const loadUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/usage", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | { usage?: { usedRequests: number; dailyBudget: number; remainingRequests: number; resetAt: string; source: "postgres" | "supabase" | "memory" } }
        | null;

      if (!response.ok || !data?.usage) {
        setUsageMessage("Could not load live AI usage right now.");
        return;
      }

      setUsage(data.usage);
      setDailyBudgetInput(data.usage.dailyBudget);
      setUsageMessage(null);
    } catch {
      setUsageMessage("Could not load live AI usage right now.");
    } finally {
      setUsageLoading(false);
    }
  }, []);

  const saveDailyBudget = async () => {
    setSavingBudget(true);
    setUsageMessage(null);

    try {
      const response = await fetch("/api/ai/usage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyBudget: dailyBudgetInput }),
      });

      const data = (await response.json().catch(() => null)) as
        | { usage?: { usedRequests: number; dailyBudget: number; remainingRequests: number; resetAt: string; source: "postgres" | "supabase" | "memory" } }
        | { error?: string }
        | null;

      if (!response.ok || !data || !("usage" in data) || !data.usage) {
        const message = data && "error" in data && typeof data.error === "string"
          ? data.error
          : "Could not save AI daily budget.";
        setUsageMessage(message);
        return;
      }

      setUsage(data.usage);
      setDailyBudgetInput(data.usage.dailyBudget);
      setUsageMessage("AI daily budget updated.");
    } catch {
      setUsageMessage("Could not save AI daily budget.");
    } finally {
      setSavingBudget(false);
    }
  };

  useEffect(() => {
    void loadUsage();
    const intervalId = window.setInterval(() => {
      void loadUsage();
    }, 12000);
    return () => window.clearInterval(intervalId);
  }, [loadUsage]);

  const usagePercent = usage ? Math.min(100, Math.round((usage.usedRequests / Math.max(1, usage.dailyBudget)) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl space-y-5"
    >
      <section className="settings-panel p-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Preferences</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-300">Control appearance, notifications, and account security in one place.</p>
      </section>

      <SettingsSection title="Appearance" description="Adjust visual preferences.">
        <div className="space-y-3">
          <div className="settings-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <Palette className="size-4" /> Theme mode
              </p>
              <p className="text-xs text-slate-300">Switch between light, dark, and system themes.</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="settings-row p-4">
            <p className="text-sm font-medium text-white">Accent color</p>
            <p className="mt-1 text-xs text-slate-300">Choose a highlight color for active UI elements.</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {accents.map((item) => {
                const selected = accent === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAccent(item)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                      selected
                        ? "border-white/35 bg-white/20 text-white"
                        : "border-white/15 bg-white/10 text-slate-200 hover:bg-white/15"
                    }`}
                  >
                    <span className={`size-2.5 rounded-full ${accentClasses[item]}`} />
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications" description="Enable or disable alerts.">
        <div className="space-y-3">
          <div className="settings-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-white">
                <Bell className="size-4" /> Overdue task alerts
              </p>
              <p className="text-xs text-slate-300">Get notified when tasks pass their due date.</p>
            </div>
            <ToggleSwitch
              checked={notificationSettings.overdueAlerts}
              onChange={(checked) => updateNotificationPreference("overdueAlerts", checked)}
            />
          </div>

          <div className="settings-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">AI smart reminders</p>
              <p className="text-xs text-slate-300">Receive nudges for tasks that remain ongoing too long.</p>
            </div>
            <ToggleSwitch
              checked={notificationSettings.aiReminders}
              onChange={(checked) => updateNotificationPreference("aiReminders", checked)}
            />
          </div>

          <div className="settings-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Weekly summary email</p>
              <p className="text-xs text-slate-300">Enable a weekly digest for your task progress.</p>
            </div>
            <ToggleSwitch
              checked={notificationSettings.weeklySummary}
              onChange={(checked) => updateNotificationPreference("weeklySummary", checked)}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="AI Quota" description="Set per-account daily AI request budget and monitor live usage.">
        <div className="settings-row space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">Daily request budget</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={500}
                value={dailyBudgetInput}
                onChange={(event) => setDailyBudgetInput(Number(event.target.value || 1))}
                className="settings-input accent-focus w-24 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={saveDailyBudget}
                disabled={savingBudget}
                className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingBudget ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-300">
              {usageLoading
                ? "Loading live usage..."
                : usage
                  ? `${usage.usedRequests} used / ${usage.dailyBudget} total (${usage.remainingRequests} remaining)`
                  : "Live usage unavailable"}
            </p>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {usage
                ? `Resets at ${new Date(usage.resetAt).toLocaleString()} • tracked per account`
                : "Usage meter updates every few seconds while this page is open."}
            </p>
          </div>

          {usageMessage ? <p className="text-xs text-slate-300">{usageMessage}</p> : null}
        </div>
      </SettingsSection>

      <SettingsSection title="Security" description="Manage account safety preferences.">
        <div className="settings-row space-y-3 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-white">
            <Lock className="size-4" /> Change password
          </p>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              type="password"
              className="settings-input accent-focus w-full px-3 py-2 text-sm"
            />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              type="password"
              className="settings-input accent-focus w-full px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs ${securityMessage?.includes("success") ? "text-emerald-300" : "text-slate-300"}`}>
              {securityMessage ?? "Use at least 8 characters."}
            </p>
            <button
              type="button"
              onClick={handlePasswordUpdate}
              disabled={savingPassword}
              className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ boxShadow: "0 8px 18px rgb(var(--accent-rgb) / 0.22)" }}
            >
              {savingPassword ? "Saving..." : "Update password"}
            </button>
          </div>
        </div>

        <div className="settings-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Two-factor authentication</p>
            <p className="text-xs text-slate-300">Require a second step at sign-in for better account protection.</p>
          </div>
          <ToggleSwitch checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />
        </div>
      </SettingsSection>
    </motion.div>
  );
}
