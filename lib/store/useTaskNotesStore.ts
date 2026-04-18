"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TaskNoteAttachment } from "@/lib/types/taskNotes";

interface TaskNotesStore {
  notesByTaskId: Record<string, string>;
  attachmentsByTaskId: Record<string, TaskNoteAttachment[]>;
  setNotesByTaskId: (notes: Record<string, string>) => void;
  setAttachmentsByTaskId: (attachments: Record<string, TaskNoteAttachment[]>) => void;
  setTaskAttachments: (taskId: string, attachments: TaskNoteAttachment[]) => void;
  setTaskNote: (taskId: string, note: string) => void;
  removeTaskNote: (taskId: string) => void;
}

export const useTaskNotesStore = create<TaskNotesStore>()(
  persist(
    (set) => ({
      notesByTaskId: {},
      attachmentsByTaskId: {},
      setNotesByTaskId: (notes) => {
        set({ notesByTaskId: notes });
      },
      setAttachmentsByTaskId: (attachments) => {
        set({ attachmentsByTaskId: attachments });
      },
      setTaskAttachments: (taskId, attachments) => {
        set((state) => ({
          attachmentsByTaskId: {
            ...state.attachmentsByTaskId,
            [taskId]: attachments,
          },
        }));
      },
      setTaskNote: (taskId, note) => {
        set((state) => ({
          notesByTaskId: {
            ...state.notesByTaskId,
            [taskId]: note,
          },
        }));
      },
      removeTaskNote: (taskId) => {
        set((state) => {
          const next = { ...state.notesByTaskId };
          const nextAttachments = { ...state.attachmentsByTaskId };
          delete next[taskId];
          delete nextAttachments[taskId];
          return { notesByTaskId: next, attachmentsByTaskId: nextAttachments };
        });
      },
    }),
    {
      name: "task-notes-store",
    },
  ),
);
