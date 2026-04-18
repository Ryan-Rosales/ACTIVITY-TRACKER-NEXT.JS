import type { PoolClient } from "pg";
import type { TaskNoteAttachment, TaskNotesPayload } from "@/lib/types/taskNotes";
import { hydrateAttachmentsWithPreviewUrls } from "@/lib/server/supabaseStorage";

const legacyAttachmentsPattern = /\[ATTACHMENTS_JSON\]([\s\S]*?)\[\/ATTACHMENTS_JSON\]/;

const normalizeAttachment = (raw: Partial<TaskNoteAttachment>): TaskNoteAttachment | null => {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const type = typeof raw.type === "string" ? raw.type.trim() : "application/octet-stream";
  const uploadedAt = typeof raw.uploadedAt === "string" ? raw.uploadedAt : new Date().toISOString();
  const storagePath = typeof raw.storagePath === "string" ? raw.storagePath.trim() : "";
  const size = typeof raw.size === "number" ? raw.size : 0;

  if (!id || !name || !storagePath || size < 0) {
    return null;
  }

  return {
    id,
    name,
    type,
    size,
    uploadedAt,
    storagePath,
  };
};

export const parseLegacyAttachmentsFromNote = (note: string): TaskNoteAttachment[] => {
  const match = note.match(legacyAttachmentsPattern);
  if (!match?.[1]) return [];

  try {
    const parsed = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const maybe = normalizeAttachment(entry as Partial<TaskNoteAttachment>);
        return maybe;
      })
      .filter((entry): entry is TaskNoteAttachment => !!entry);
  } catch {
    return [];
  }
};

export const stripLegacyAttachmentsFromNote = (note: string) =>
  note.replace(legacyAttachmentsPattern, "").replace(/\n{3,}/g, "\n\n").trim();

export const ensureTaskNotesTable = async (client: PoolClient) => {
  await client.query(
    `create table if not exists public.task_notes (
      owner_email text not null,
      task_id text not null,
      note text not null default '',
      attachments jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (owner_email, task_id)
    )`,
  );

  await client.query(
    `alter table public.task_notes
     add column if not exists attachments jsonb not null default '[]'::jsonb`,
  );

  await client.query(
    `create index if not exists task_notes_owner_updated_idx
      on public.task_notes (owner_email, updated_at desc)`,
  );
};

export const selectTaskNotesPayload = async (client: PoolClient, email: string): Promise<TaskNotesPayload> => {
  const result = await client.query(
    `select task_id, note, attachments from public.task_notes where owner_email = $1`,
    [email],
  );

  const notesByTaskId: Record<string, string> = {};
  const rawAttachmentsByTaskId: Record<string, TaskNoteAttachment[]> = {};

  for (const row of result.rows) {
    const cleanNote = stripLegacyAttachmentsFromNote(typeof row.note === "string" ? row.note : "");
    notesByTaskId[row.task_id] = cleanNote;

    const fromColumn = Array.isArray(row.attachments)
      ? row.attachments
          .map((entry: unknown) => (entry && typeof entry === "object" ? normalizeAttachment(entry as Partial<TaskNoteAttachment>) : null))
          .filter((entry: TaskNoteAttachment | null): entry is TaskNoteAttachment => !!entry)
      : [];

    rawAttachmentsByTaskId[row.task_id] = fromColumn.length ? fromColumn : parseLegacyAttachmentsFromNote(typeof row.note === "string" ? row.note : "");
  }

  const attachmentTasks = Object.entries(rawAttachmentsByTaskId);
  const hydratedPairs = await Promise.all(
    attachmentTasks.map(async ([taskId, attachments]) => [taskId, await hydrateAttachmentsWithPreviewUrls(attachments)] as const),
  );

  const attachmentsByTaskId = hydratedPairs.reduce<Record<string, TaskNoteAttachment[]>>((acc, [taskId, attachments]) => {
    acc[taskId] = attachments;
    return acc;
  }, {});

  return {
    notesByTaskId,
    attachmentsByTaskId,
  };
};
