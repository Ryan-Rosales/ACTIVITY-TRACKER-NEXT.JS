"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { GradientButton } from "@/components/ui/GradientButton";

export function LoginCard() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rememberedEmail = window.localStorage.getItem("activity-tracker-remembered-email");
    const rememberedEnabled = window.localStorage.getItem("activity-tracker-remember-me") === "true";

    if (rememberedEnabled) {
      setRemember(true);
      if (rememberedEmail) {
        setEmail(rememberedEmail);
      }
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (mode === "signup") {
      if (fullName.trim().length < 2) {
        setError("Enter your full name.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (!acceptPolicy) {
        setError("Please accept the terms to create your account.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signup(email, password, fullName);
        setSuccess(result.message);
        setPassword("");
        setConfirmPassword("");
        if (result.user?.email) {
          router.push("/dashboard");
        } else {
          setMode("signin");
        }
      } else {
        await login(email, password, remember);
        if (typeof window !== "undefined") {
          if (remember) {
            window.localStorage.setItem("activity-tracker-remembered-email", email);
            window.localStorage.setItem("activity-tracker-remember-me", "true");
          } else {
            window.localStorage.removeItem("activity-tracker-remembered-email");
            window.localStorage.setItem("activity-tracker-remember-me", "false");
          }
        }
        router.push("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      const normalized = message.toLowerCase();
      if (
        normalized.includes("not confirmed") ||
        normalized.includes("already registered") ||
        normalized.includes("already exists") ||
        normalized.includes("already registered with a different password")
      ) {
        setMode("signin");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-[1.7rem] border border-white/20 bg-[linear-gradient(170deg,rgba(255,255,255,0.9),rgba(248,250,252,0.76))] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:bg-[linear-gradient(170deg,rgba(15,23,42,0.86),rgba(2,6,23,0.7))] sm:p-7"
    >
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center rounded-full border border-white/25 bg-white/60 px-2 py-1 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode === "signin" ? "text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            }`}
          >
            {mode === "signin" ? (
              <motion.span
                layoutId="auth-mode-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:bg-white/20"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            ) : null}
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode === "signup" ? "text-[var(--text-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            }`}
          >
            {mode === "signup" ? (
              <motion.span
                layoutId="auth-mode-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:bg-white/20"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            ) : null}
            Create account
          </button>
        </div>

        <h2 className="font-display text-2xl text-[var(--text-strong)]">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {mode === "signin"
            ? "Sign in to the same workspace that follows your theme, layout, and saved preferences."
            : "Create a workspace profile that matches your system settings and keeps everything organized from the start."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {mode === "signup" ? (
            <motion.label
              key="full-name"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="block"
            >
              <span className="mb-1 block text-xs text-[var(--text-subtle)]">Full name</span>
              <div className="rounded-xl border border-slate-300/60 bg-white/75 transition focus-within:border-[rgb(var(--accent-rgb)/0.85)] dark:border-white/20 dark:bg-black/20">
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[var(--text-strong)] outline-none"
                  placeholder="Ryan Smith"
                  type="text"
                  required
                />
              </div>
            </motion.label>
          ) : null}
        </AnimatePresence>

        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-subtle)]">Email</span>
          <div className="rounded-xl border border-slate-300/60 bg-white/75 transition focus-within:border-[rgb(var(--accent-rgb)/0.85)] dark:border-white/20 dark:bg-black/20">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[var(--text-strong)] outline-none"
              placeholder="you@company.com"
              type="email"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-subtle)]">Password</span>
          <div className="rounded-xl border border-slate-300/60 bg-white/75 transition focus-within:border-[rgb(var(--accent-rgb)/0.85)] dark:border-white/20 dark:bg-black/20">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[var(--text-strong)] outline-none"
              placeholder="••••••••"
              type="password"
              required
            />
          </div>
        </label>

        <AnimatePresence initial={false} mode="popLayout">
          {mode === "signup" ? (
            <motion.label
              key="confirm-password"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="block"
            >
              <span className="mb-1 block text-xs text-[var(--text-subtle)]">Confirm password</span>
              <div className="rounded-xl border border-slate-300/60 bg-white/75 transition focus-within:border-[rgb(var(--accent-rgb)/0.85)] dark:border-white/20 dark:bg-black/20">
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[var(--text-strong)] outline-none"
                  placeholder="••••••••"
                  type="password"
                  required
                />
              </div>
            </motion.label>
          ) : null}
        </AnimatePresence>

        {mode === "signin" ? (
          <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="rounded border-slate-300/70 bg-white/70 dark:border-white/30 dark:bg-black/20"
              />
              Remember me
            </label>
            <Link href="#" className="text-[rgb(var(--accent-rgb)/1)] hover:opacity-80">
              Forgot password?
            </Link>
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={acceptPolicy}
              onChange={(event) => setAcceptPolicy(event.target.checked)}
              className="rounded border-slate-300/70 bg-white/70 dark:border-white/30 dark:bg-black/20"
            />
            I agree to the terms and privacy policy.
          </label>
        )}

        {error ? <p className="animate-pulse text-sm text-red-500 dark:text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{success}</p> : null}

        <GradientButton type="submit" className="w-full" loading={loading}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </GradientButton>
      </form>

      <p className="mt-4 text-center text-xs text-[var(--text-subtle)]">
        Your sign-in is synced with the same workspace settings used across the app.
      </p>
    </motion.div>
  );
}
