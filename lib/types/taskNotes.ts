export type TaskNoteAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  storagePath: string;
  previewUrl?: string;
};

export type TaskNotesPayload = {
  notesByTaskId: Record<string, string>;
  attachmentsByTaskId: Record<string, TaskNoteAttachment[]>;
};
