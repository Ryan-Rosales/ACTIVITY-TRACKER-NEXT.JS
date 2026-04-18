"use client";

import { motion } from "framer-motion";
import { LoginCard } from "@/components/auth/LoginCard";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden p-4 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgb(var(--accent-rgb)/0.22),transparent_44%),radial-gradient(circle_at_88%_14%,rgba(56,189,248,0.16),transparent_40%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_38%)]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/8 backdrop-blur-2xl shadow-[0_30px_90px_rgba(2,6,23,0.22)] lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col justify-between border-b border-white/15 p-7 sm:p-10 lg:border-b-0 lg:border-r"
        >
          <div className="space-y-6">
            <p className="w-fit rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Activity Tracker AI
            </p>
            <h1 className="max-w-xl font-display text-4xl leading-[1.02] text-[var(--text-strong)] sm:text-5xl">
              Focused planning,
              <br />
              minimal workflow.
            </h1>
            <p className="max-w-lg text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              A clean workspace that adapts to your system theme and keeps tasks, notes, and decisions in one calm surface.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">Boards</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">4 views</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">Context</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">Live notes</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-subtle)]">Flow</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">No clutter</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
            className="hidden rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-[var(--text-muted)] lg:block"
          >
            Continue with your existing account, or create a new one from the same panel.
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center justify-center p-6 sm:p-10"
        >
          <div className="w-full max-w-xl">
            <LoginCard />
          </div>
        </motion.section>
      </div>
    </main>
  );
}
