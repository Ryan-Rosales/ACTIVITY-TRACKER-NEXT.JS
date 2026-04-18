"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotificationStore } from "@/lib/store/useNotificationStore";

export default function NotificationsPage() {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const dismiss = useNotificationStore((state) => state.dismissNotification);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleRead = (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    markAsRead(id);
    setTimeout(() => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  const handleDismiss = (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    dismiss(id);
    setTimeout(() => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">All Notifications</h2>
        <button
          onClick={markAllAsRead}
          type="button"
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={handleRead}
            onDismiss={handleDismiss}
            isProcessing={processingIds.has(notification.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}
