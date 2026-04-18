import { ReactNode } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <GlassCard className="settings-panel space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white dark:text-white">{title}</h3>
        {description ? <p className="text-sm text-slate-300 dark:text-slate-300">{description}</p> : null}
      </div>
      {children}
    </GlassCard>
  );
}
