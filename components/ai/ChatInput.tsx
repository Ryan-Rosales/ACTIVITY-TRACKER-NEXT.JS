"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ChatInput({ onSend, disabled }: { onSend: (message: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim() || disabled) return;
        onSend(value);
        setValue("");
      }}
      className="flex items-center gap-2 border-t border-white/10 p-3"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask the AI assistant..."
        className="settings-input accent-focus flex-1 px-3 py-2 text-sm outline-none"
      />
      <button
        type="submit"
        className="rounded-xl p-2 text-white disabled:opacity-60"
        style={{
          background: "linear-gradient(90deg, var(--accent), #3b82f6)",
          boxShadow: "0 8px 20px rgb(var(--accent-rgb) / 0.3)",
        }}
        disabled={disabled}
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}

//