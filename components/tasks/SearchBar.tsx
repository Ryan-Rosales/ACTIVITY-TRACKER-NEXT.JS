"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeStore } from "@/lib/store/useThemeStore";

interface SearchBarProps {
  onSearch: (value: string) => void;
  onStatusFilter: (value: "all" | "pending" | "ongoing" | "completed") => void;
  onPriorityFilter: (value: "all" | "low" | "medium" | "high") => void;
  priorityOptions: Array<"low" | "medium" | "high">;
}

export function SearchBar({ onSearch, onStatusFilter, onPriorityFilter, priorityOptions }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "ongoing" | "completed">("all");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [priority, setPriority] = useState<"all" | "low" | "medium" | "high">("all");
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [onSearch, query]);

  return (
    <div className={`relative z-[80] flex flex-col gap-3 rounded-2xl border p-4 backdrop-blur-xl md:flex-row md:items-center ${
      isLight ? "border-slate-200 bg-white/95" : "border-white/20 bg-white/10"
    }`}>
      <div className="relative flex-1">
        <Search className={`absolute left-3 top-2.5 size-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks..."
          className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-400 ${
            isLight
              ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
              : "border-white/20 bg-black/20 text-white placeholder:text-slate-500"
          }`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "ongoing", "completed"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setSelectedStatus(status);
              onStatusFilter(status);
            }}
            className={`rounded-full border px-3 py-1 text-xs transition ${isLight ? "text-slate-700" : "text-slate-200"}`}
            style={
              selectedStatus === status
                ? {
                    borderColor: "rgb(var(--accent-rgb) / 0.6)",
                    backgroundColor: "rgb(var(--accent-rgb) / 0.22)",
                    boxShadow: "0 0 0 1px rgb(var(--accent-rgb) / 0.15) inset, 0 8px 18px rgb(var(--accent-rgb) / 0.25)",
                    color: "white",
                  }
                : isLight
                  ? { borderColor: "rgb(148 163 184 / 0.35)", backgroundColor: "rgb(248 250 252 / 0.95)" }
                  : { borderColor: "rgb(255 255 255 / 0.2)", backgroundColor: "rgb(255 255 255 / 0.05)" }
            }
          >
            {status}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setPriorityOpen((state) => !state)}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition hover:bg-white/15 ${
            isLight ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "border-white/20 bg-white/10 text-white"
          }`}
        >
          {priority === "all" ? "All Priorities" : `${priority[0].toUpperCase()}${priority.slice(1)} Priority`}
          <ChevronDown className="size-4" />
        </button>

        {priorityOpen ? (
          <div className={`absolute right-0 z-[200] mt-2 w-44 rounded-xl border p-1.5 text-sm shadow-xl ${
            isLight ? "border-slate-200 bg-white text-slate-900" : "border-white/20 bg-slate-900/95 text-white"
          }`}>
            {(["all", ...priorityOptions] as const).map((option) => {
              const active = priority === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPriority(option);
                    onPriorityFilter(option);
                    setPriorityOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition ${
                    active ? (isLight ? "bg-slate-100" : "bg-white/15") : isLight ? "hover:bg-slate-50" : "hover:bg-white/10"
                  }`}
                >
                  <span>{option === "all" ? "All Priorities" : `${option[0].toUpperCase()}${option.slice(1)} Priority`}</span>
                  {active ? <Check className="size-3.5" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
