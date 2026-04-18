export type StoredSettings = {
  ownerEmail: string;
  displayName: string;
  email: string;
  avatar?: string;
  themeMode: "system" | "light" | "dark";
  sidebarCollapsed: boolean;
  accent: "violet" | "teal" | "sunset" | "emerald" | "rose";
  overdueAlerts: boolean;
  aiReminders: boolean;
  weeklySummary: boolean;
  twoFactorEnabled: boolean;
};
