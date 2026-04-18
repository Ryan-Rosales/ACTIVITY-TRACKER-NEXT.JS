"use client";

import { useEffect, useState } from "react";
import { Camera, Mail, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const pushNotification = useNotificationStore((state) => state.pushNotification);

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Helper to compress image before upload
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress with 0.7 quality to reduce size significantly
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = dataUrl;
    });
  };

  useEffect(() => {
    setDisplayName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPendingAvatar(null);
  }, [user?.email, user?.name]);

  useEffect(() => {
    void fetch("/api/auth/profile")
      .then((response) => response.json())
      .then((data) => {
        const profile = data?.profile;
        if (!profile) return;

        useAuthStore.setState((state) => ({
          ...state,
          user: state.user
            ? {
                ...state.user,
                name: profile.displayName ?? state.user.name,
                email: profile.email ?? state.user.email,
                avatar: profile.avatar ?? state.user.avatar,
              }
            : state.user,
        }));

        setDisplayName(profile.displayName ?? "");
        setEmail(profile.email ?? "");
      })
      .catch(() => {
        // Keep local state if profile fetch fails.
      });
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile({
        name: displayName.trim() || "User",
        email: email.trim() || "",
        avatar: pendingAvatar !== null ? pendingAvatar : undefined,
      });
      setPendingAvatar(null);
      setMessage("Profile saved to database.");
      pushNotification({ type: "profile_saved", message: "Profile saved successfully." });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Could not save profile.";
      setMessage(reason);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl space-y-4"
    >
      <section className="settings-panel p-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Account</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-white">Profile</h2>
        <p className="mt-1 text-sm text-slate-300">Update the core information your workspace uses across devices.</p>
      </section>

      <SettingsSection title="Profile" description="Manage your personal information.">
        <div className="settings-row flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} src={pendingAvatar ?? user?.avatar} className="size-14" />
            <div>
              <p className="text-sm font-semibold text-white">Profile photo</p>
              <p className="text-xs text-slate-300">Shown in top-right avatar menu. Click Save profile to persist changes.</p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15">
            <Camera className="size-4" />
            <span>Upload avatar</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const original = String(reader.result);
                    const compressed = await compressImage(original);
                    setPendingAvatar(compressed);
                    setMessage("Avatar selected. Click Save profile to upload.");
                  } catch (error) {
                    setMessage("Could not process avatar image.");
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>

        <div className="settings-row grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs text-slate-300">
              <UserRound className="size-3.5" /> Display name
            </span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              className="settings-input accent-focus w-full px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="inline-flex items-center gap-1 text-xs text-slate-300">
              <Mail className="size-3.5" /> Email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="settings-input accent-focus w-full px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-300">{message ?? "Profile changes sync to your account."}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDisplayName(user?.name ?? "");
                setEmail(user?.email ?? "");
                setPendingAvatar(null);
                setMessage("Changes discarded.");
              }}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{
                background: "linear-gradient(90deg, var(--accent), #3b82f6)",
                boxShadow: "0 10px 22px rgb(var(--accent-rgb) / 0.32)",
                opacity: saving ? 0.75 : 1,
              }}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </SettingsSection>
    </motion.div>
  );
}
