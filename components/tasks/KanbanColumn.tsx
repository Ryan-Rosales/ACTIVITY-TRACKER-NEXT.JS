import { useThemeStore } from "@/lib/store/useThemeStore";
import { LucideIcon } from "lucide-react";
import { Task } from "@/lib/types";
import { TaskCard, TaskConfirmationAction } from "@/components/tasks/TaskCard";

interface KanbanColumnProps {
  title: string;
  icon: LucideIcon;
  color: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onOpenNotes: (task: Task) => void;
  onRequestConfirmation: (action: TaskConfirmationAction) => void;
}

export function KanbanColumn({
  title,
  icon: Icon,
  color,
  tasks,
  onEdit,
  onOpenNotes,
  onRequestConfirmation,
}: KanbanColumnProps) {
  const mode = useThemeStore((state) => state.mode);
  const isLight = mode === "light";

  return (
    <section className={`rounded-2xl border p-3 backdrop-blur-xl ${isLight ? "border-slate-200 bg-white/95" : "border-white/20 bg-white/10"}`}>
      <header className={`mb-3 flex items-center justify-between rounded-xl bg-gradient-to-r ${color} px-3 py-2 ${isLight ? "text-slate-900" : "text-white"}`}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4" /> {title}
        </p>
        <span className={`rounded-full px-2 py-0.5 text-xs ${isLight ? "bg-white/70 text-slate-800" : "bg-black/20 text-white"}`}>{tasks.length}</span>
      </header>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onOpenNotes={onOpenNotes}
            onRequestConfirmation={onRequestConfirmation}
          />
        ))}
      </div>
    </section>
  );
}
