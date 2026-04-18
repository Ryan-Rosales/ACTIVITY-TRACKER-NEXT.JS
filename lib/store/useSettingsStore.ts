"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const accentPalette: Record<SettingsState["accent"], string> = {
  violet: "#6c63ff",
  teal: "#14b8a6",
  sunset: "#f97316",
  emerald: "#10b981",
  rose: "#f43f5e",
};

const accentRgbPalette: Record<SettingsState["accent"], string> = {
  violet: "108 99 255",
  teal: "20 184 166",
  sunset: "249 115 22",
  emerald: "16 185 129",
  rose: "244 63 94",
};

const applyAccent = (accent: SettingsState["accent"]) => {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--accent", accentPalette[accent]);
  document.documentElement.style.setProperty("--accent-rgb", accentRgbPalette[accent]);
};

interface SettingsState {
  accent: "violet" | "teal" | "sunset" | "emerald" | "rose";
  twoFactorEnabled: boolean;
  displayName?: string;
  email?: string;
  avatar?: string;
  themeMode: "system" | "light" | "dark";
  sidebarCollapsed: boolean;
  overdueAlerts: boolean;
  aiReminders: boolean;
  weeklySummary: boolean;
  hydrate: (settings: Partial<SettingsState>) => void;
  setAccent: (accent: SettingsState["accent"]) => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: SettingsState["themeMode"]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setOverdueAlerts: (enabled: boolean) => void;
  setAiReminders: (enabled: boolean) => void;
  setWeeklySummary: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accent: "violet",
      twoFactorEnabled: false,
      themeMode: "dark",
      sidebarCollapsed: false,
      overdueAlerts: true,
      aiReminders: true,
      weeklySummary: false,
      hydrate: (settings) => {
        if (settings.accent) applyAccent(settings.accent);
        set(settings);
      },
      setAccent: (accent) => {
        applyAccent(accent);
        set({ accent });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accent }),
        });
      },
      setTwoFactorEnabled: (twoFactorEnabled) => {
        set({ twoFactorEnabled });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ twoFactorEnabled }),
        });
      },
      setThemeMode: (themeMode) => {
        set({ themeMode });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themeMode }),
        });
      },
      setSidebarCollapsed: (sidebarCollapsed) => {
        set({ sidebarCollapsed });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sidebarCollapsed }),
        });
      },
      setOverdueAlerts: (overdueAlerts) => {
        set({ overdueAlerts });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overdueAlerts }),
        });
      },
      setAiReminders: (aiReminders) => {
        set({ aiReminders });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiReminders }),
        });
      },
      setWeeklySummary: (weeklySummary) => {
        set({ weeklySummary });
        void fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weeklySummary }),
        });
      },
    }),
    {
      name: "settings-store",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyAccent(state.accent);
      },
    },
  ),
);
