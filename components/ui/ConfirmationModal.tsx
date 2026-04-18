"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useThemeStore } from "@/lib/store/useThemeStore";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = "primary",
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[360] grid place-items-center bg-black/65 p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl backdrop-blur-2xl ${
              isLight ? "border-slate-200 bg-white/95 text-slate-900" : "border-white/20 bg-slate-950/95 text-white"
            }`}
          >
            <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{title}</h3>
            <p className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  confirmVariant === "danger"
                    ? isLight
                      ? "border-red-300 bg-red-500/10 text-red-700 hover:bg-red-500/15"
                      : "border-red-300/30 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                    : isLight
                      ? "border-violet-300 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15"
                      : "border-violet-300/30 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}