import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { runWithUserContext } from "@/lib/server/db";
import { mapNotificationRow } from "@/lib/server/mappers";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

export async function GET() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await runWithUserContext(email, async (client) => {
    const result = await client.query(
      "select * from public.notifications where owner_email = $1 order by timestamp desc",
      [email],
    );
    return result.rows.map(mapNotificationRow);
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await runWithUserContext(email, async (client) => {
    if (body.action === "markAllAsRead") {
      await client.query("update public.notifications set read = true where owner_email = $1", [email]);
      return;
    }

    if (body.action === "markAsRead") {
      await client.query("update public.notifications set read = true where id = $1 and owner_email = $2", [body.id, email]);
      return;
    }

    if (body.action === "dismiss") {
      await client.query("delete from public.notifications where id = $1 and owner_email = $2", [body.id, email]);
      return;
    }

    if (body.action === "clearAll") {
      await client.query("delete from public.notifications where owner_email = $1", [email]);
    }
  });

  return NextResponse.json({ ok: true });
}
