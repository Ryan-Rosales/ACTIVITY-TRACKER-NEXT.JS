import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWithUserContext } from "@/lib/server/db";
import { ensureTaskNotesTable, selectTaskNotesPayload, stripLegacyAttachmentsFromNote } from "@/lib/server/taskNotesDb";
import { TASK_NOTES_BUCKET, getSupabaseStorageClient } from "@/lib/server/supabaseStorage";
import type { TaskNoteAttachment } from "@/lib/types/taskNotes";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await runWithUserContext(email, async (client) => {
    await ensureTaskNotesTable(client);
    return selectTaskNotesPayload(client, email);
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.taskId) return NextResponse.json({ error: "taskId is required." }, { status: 400 });

  const attachments = Array.isArray(body.attachments)
    ? body.attachments
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: Record<string, unknown>) => ({
          id: typeof item.id === "string" ? item.id : "",
          name: typeof item.name === "string" ? item.name : "",
          type: typeof item.type === "string" ? item.type : "application/octet-stream",
          size: typeof item.size === "number" ? item.size : 0,
          uploadedAt: typeof item.uploadedAt === "string" ? item.uploadedAt : new Date().toISOString(),
          storagePath: typeof item.storagePath === "string" ? item.storagePath : "",
        }))
        .filter((item: TaskNoteAttachment) => !!item.id && !!item.name && !!item.storagePath && item.size >= 0)
    : [];

  const cleanNote = stripLegacyAttachmentsFromNote(typeof body.note === "string" ? body.note : "");

  await runWithUserContext(email, async (client) => {
    await ensureTaskNotesTable(client);
    await client.query(
      `insert into public.task_notes (owner_email, task_id, note, attachments)
       values ($1, $2, $3, $4::jsonb)
       on conflict (owner_email, task_id)
       do update set note = excluded.note, attachments = excluded.attachments, updated_at = now()`,
      [email, body.taskId, cleanNote, JSON.stringify(attachments)],
    );
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.taskId) return NextResponse.json({ error: "taskId is required." }, { status: 400 });

  const storagePaths = await runWithUserContext(email, async (client) => {
    await ensureTaskNotesTable(client);
    const row = await client.query(
      `select attachments from public.task_notes where owner_email = $1 and task_id = $2 limit 1`,
      [email, body.taskId],
    );

    const attachments = Array.isArray(row.rows[0]?.attachments) ? row.rows[0].attachments : [];
    return attachments
      .map((item: { storagePath?: unknown }) => (typeof item.storagePath === "string" ? item.storagePath : ""))
      .filter((path: string) => !!path);
  });

  if (storagePaths.length) {
    const storageClient = getSupabaseStorageClient();
    const { error } = await storageClient.storage.from(TASK_NOTES_BUCKET).remove(storagePaths);
    if (error) {
      console.warn("Task note attachment cleanup failed:", error.message);
    }
  }

  await runWithUserContext(email, async (client) => {
    await ensureTaskNotesTable(client);
    await client.query(
      `delete from public.task_notes where owner_email = $1 and task_id = $2`,
      [email, body.taskId],
    );
  });

  return NextResponse.json({ ok: true });
}
