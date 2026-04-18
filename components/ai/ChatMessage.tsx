import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/dateHelpers";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const user = message.role === "user";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: user ? 16 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${user ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          user
            ? "text-white"
            : "border border-white/20 bg-white/10 text-slate-100 backdrop-blur-xl"
        }`}
        style={
          user
            ? {
                background: "linear-gradient(90deg, var(--accent), #3b82f6)",
                boxShadow: "0 8px 20px rgb(var(--accent-rgb) / 0.25)",
              }
            : undefined
        }
      >
        <p>{message.content}</p>
        <p className="mt-1 text-[10px] opacity-70">{mounted ? formatDateTime(message.timestamp) : "..."}</p>
      </div>
    </motion.div>
  );
}
