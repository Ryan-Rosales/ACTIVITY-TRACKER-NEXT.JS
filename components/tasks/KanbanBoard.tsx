"use client";

import { CheckCircle2, CircleDashed, PlayCircle } from "lucide-react";
import { Task } from "@/lib/types";
import { TaskConfirmationAction } from "@/components/tasks/TaskCard";
import { KanbanColumn } from "@/components/tasks/KanbanColumn";

export function KanbanBoard({
  tasks,
  statusFilter,
  onEdit,
  onOpenNotes,
  onRequestConfirmation,
}: {
  tasks: Task[];
  statusFilter: "all" | "pending" | "ongoing" | "completed";
  onEdit: (task: Task) => void;
  onOpenNotes: (task: Task) => void;
  onRequestConfirmation: (action: TaskConfirmationAction) => void;
}) {
  const pending = tasks.filter((task) => task.status === "pending");
  const ongoing = tasks.filter((task) => task.status === "ongoing");
  const completed = tasks.filter((task) => task.status === "completed");

  const sections = [
    {
      key: "pending",
      title: "Pending",
      icon: CircleDashed,
      color: "from-amber-500 to-orange-400",
      tasks: pending,
    },
    {
      key: "ongoing",
      title: "Ongoing",
      icon: PlayCircle,
      color: "from-blue-500 to-cyan-400",
      tasks: ongoing,
    },
    {
      key: "completed",
      title: "Completed",
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-400",
      tasks: completed,
    },
  ] as const;

  const visibleSections = statusFilter === "all" ? sections : sections.filter((section) => section.key === statusFilter);

  return (
    <div className={`grid grid-cols-1 gap-4 ${visibleSections.length > 1 ? "xl:grid-cols-3" : ""}`}>
      {visibleSections.map((section) => (
        <KanbanColumn
          key={section.key}
          title={section.title}
          icon={section.icon}
          color={section.color}
          tasks={section.tasks}
          onEdit={onEdit}
          onOpenNotes={onOpenNotes}
          onRequestConfirmation={onRequestConfirmation}
        />
      ))}
    </div>
  );
}
