"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useThemeStore } from "@/lib/store/useThemeStore";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropdownTransition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Palette },
  ] as const;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
        title="Theme"
        aria-label="Theme"
      >
        <Palette className="size-4" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={dropdownTransition}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-white/20 bg-slate-900/95 p-1.5 text-sm text-white shadow-xl"
          >
          {options.map((option) => {
            const Icon = option.icon;
            const active = mode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMode(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="size-3.5" /> {option.label}
                </span>
                {active ? <Check className="size-3.5" /> : null}
              </button>
            );
          })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
