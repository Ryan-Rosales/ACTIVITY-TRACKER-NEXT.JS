"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
      aria-pressed={checked}
    >
      {label ? <span className="text-sm text-white/80 dark:text-white/80">{label}</span> : null}
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
          checked ? "accent-soft-border accent-soft-bg" : "border-white/20 bg-white/10",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute left-0.5 size-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
        />
      </span>
    </button>
  );
}
