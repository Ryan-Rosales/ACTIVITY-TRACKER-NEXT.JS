"use client";

import { useState } from "react";
import { AIAction, ChatMessage, Task } from "@/lib/types";

type AttachedTaskContext = Task & {
  note?: string;
};

interface AIResponse {
  reply: string;
  action?: AIAction;
}

type AskAIOptions = {
  attachedTaskIds?: string[];
  attachedTasks?: AttachedTaskContext[];
};

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askAI = async (messages: ChatMessage[], tasks: Task[], options?: AskAIOptions) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          context: { tasks },
          attachedTaskIds: options?.attachedTaskIds ?? [],
          attachedTasks: options?.attachedTasks ?? [],
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { reply?: string; action?: AIAction; error?: string }
        | null;

      if (!response.ok) {
        if (typeof data?.reply === "string" && data.reply.trim()) {
          return { reply: data.reply.trim(), action: data.action } satisfies AIResponse;
        }

        const backendMessage = typeof data?.error === "string" ? data.error : "AI request failed";
        throw new Error(backendMessage);
      }

      return {
        reply: typeof data?.reply === "string" ? data.reply : "",
        action: data?.action,
      } satisfies AIResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);

      const normalized = message.toLowerCase();
      const userFacingMessage = normalized.includes("quota") || normalized.includes("429")
        ? "AI quota limit reached right now. Please try again shortly."
        : normalized.includes("api key") || normalized.includes("unauthorized") || normalized.includes("permission")
          ? "AI provider credentials are invalid or missing. Please check server configuration."
          : normalized.includes("model")
            ? "AI model is unavailable right now. Please try again in a moment."
            : "I couldn't reach the AI service right now. You can still keep tracking tasks, and I can try again in a moment.";

      return {
        reply: userFacingMessage,
      } satisfies AIResponse;
    } finally {
      setLoading(false);
    }
  };

  return { askAI, loading, error };
}
