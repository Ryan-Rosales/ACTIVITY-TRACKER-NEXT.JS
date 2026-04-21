import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDailyUsageSnapshot, setDailyBudget } from "@/lib/server/aiQuota";

const getEmail = async () => (await cookies()).get("activity_user_email")?.value?.trim().toLowerCase() ?? "";

export async function GET() {
  const email = await getEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getDailyUsageSnapshot(email);
  return NextResponse.json({ usage });
}

export async function PATCH(request: Request) {
  const email = await getEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { dailyBudget?: number };
  const requested = Number(body.dailyBudget);
  if (!Number.isFinite(requested)) {
    return NextResponse.json({ error: "dailyBudget must be a number." }, { status: 400 });
  }

  const usage = await setDailyBudget(email, requested);
  return NextResponse.json({ usage });
}
