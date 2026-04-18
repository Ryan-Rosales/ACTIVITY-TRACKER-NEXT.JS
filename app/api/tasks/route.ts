import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWithUserContext } from "@/lib/server/db";
import { mapTaskRow } from "@/lib/server/mappers";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await runWithUserContext(email, async (client) => {
    const result = await client.query("select * from public.tasks where owner_email = $1 order by created_at desc", [email]);
    return result.rows.map(mapTaskRow);
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const task = await runWithUserContext(email, async (client) => {
    const result = await client.query(
      `insert into public.tasks (
        owner_email,
        title,
        description,
        status,
        priority,
        category,
        due_date,
        completed_at,
        archived_at,
        subtasks
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
      [
        email,
        body.title,
        body.description ?? null,
        body.status ?? "pending",
        body.priority ?? "medium",
        body.category ?? null,
        body.dueDate ?? null,
        body.completedAt ?? null,
        body.archivedAt ?? null,
        JSON.stringify(body.subtasks ?? []),
      ],
    );

    return mapTaskRow(result.rows[0]);
  });

  return NextResponse.json({ task });
}

export async function PATCH(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const task = await runWithUserContext(email, async (client) => {
    const result = await client.query(
      `update public.tasks
       set title = coalesce($3, title),
           description = coalesce($4, description),
           status = coalesce($5, status),
           priority = coalesce($6, priority),
           category = coalesce($7, category),
           due_date = coalesce($8, due_date),
           completed_at = coalesce($9, completed_at),
           archived_at = coalesce($10, archived_at),
           subtasks = coalesce($11, subtasks),
           updated_at = now()
       where id = $1 and owner_email = $2
       returning *`,
      [
        body.id,
        email,
        body.updates?.title ?? null,
        body.updates?.description ?? null,
        body.updates?.status ?? null,
        body.updates?.priority ?? null,
        body.updates?.category ?? null,
        body.updates?.dueDate ?? null,
        body.updates?.completedAt ?? null,
        body.updates?.archivedAt ?? null,
        body.updates?.subtasks ? JSON.stringify(body.updates.subtasks) : null,
      ],
    );

    return result.rows[0] ? mapTaskRow(result.rows[0]) : null;
  });

  return NextResponse.json({ task });
}

export async function DELETE(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await runWithUserContext(email, async (client) => {
    await client.query("delete from public.tasks where id = $1 and owner_email = $2", [body.id, email]);
  });

  return NextResponse.json({ ok: true });
}
