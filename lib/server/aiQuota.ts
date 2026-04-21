import { getSupabaseDataClient } from "@/lib/server/supabaseData";
import { runWithUserContext } from "@/lib/server/db";

type DailyUsageSnapshot = {
  usedRequests: number;
  dailyBudget: number;
  remainingRequests: number;
  usageDate: string;
  resetAt: string;
  source: "postgres" | "supabase" | "memory";
};

const DEFAULT_DAILY_BUDGET = Number.parseInt(process.env.AI_DAILY_REQUEST_BUDGET ?? "40", 10) || 40;

type UsageMemoryRow = {
  usedRequests: number;
  dailyBudget: number;
};

const globalForQuota = globalThis as unknown as {
  aiUsageMemory?: Map<string, UsageMemoryRow>;
  aiBudgetMemory?: Map<string, number>;
};

const usageMemory = globalForQuota.aiUsageMemory ?? new Map<string, UsageMemoryRow>();
const budgetMemory = globalForQuota.aiBudgetMemory ?? new Map<string, number>();

if (!globalForQuota.aiUsageMemory) {
  globalForQuota.aiUsageMemory = usageMemory;
}

if (!globalForQuota.aiBudgetMemory) {
  globalForQuota.aiBudgetMemory = budgetMemory;
}

const usageDateKey = () => new Date().toISOString().slice(0, 10);

const resetAtIso = () => {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return next.toISOString();
};

const toSnapshot = (
  usedRequests: number,
  dailyBudget: number,
  usageDate: string,
  source: DailyUsageSnapshot["source"],
): DailyUsageSnapshot => ({
  usedRequests,
  dailyBudget,
  remainingRequests: Math.max(0, dailyBudget - usedRequests),
  usageDate,
  resetAt: resetAtIso(),
  source,
});

const ensureQuotaTables = async (email: string) => {
  await runWithUserContext(email, async (client) => {
    await client.query(
      `create table if not exists public.ai_usage_preferences (
        owner_email text primary key,
        daily_budget integer not null default 40,
        updated_at timestamptz not null default now()
      )`,
    );

    await client.query(
      `create table if not exists public.ai_daily_usage (
        owner_email text not null,
        usage_date date not null,
        used_requests integer not null default 0,
        daily_budget integer not null default 40,
        updated_at timestamptz not null default now(),
        primary key (owner_email, usage_date)
      )`,
    );
  });
};

const getSnapshotViaPostgres = async (email: string): Promise<DailyUsageSnapshot> => {
  await ensureQuotaTables(email);

  return runWithUserContext(email, async (client) => {
    const result = await client.query(
      `with pref as (
        select daily_budget from public.ai_usage_preferences where owner_email = $1
      ),
      upsert_usage as (
        insert into public.ai_daily_usage (owner_email, usage_date, used_requests, daily_budget)
        values ($1, current_date, 0, coalesce((select daily_budget from pref), $2))
        on conflict (owner_email, usage_date) do update set
          daily_budget = coalesce((select daily_budget from pref), public.ai_daily_usage.daily_budget),
          updated_at = now()
        returning used_requests, daily_budget, usage_date
      )
      select used_requests, daily_budget, usage_date::text as usage_date
      from upsert_usage`,
      [email, DEFAULT_DAILY_BUDGET],
    );

    const row = result.rows[0];
    return toSnapshot(row.used_requests, row.daily_budget, row.usage_date, "postgres");
  });
};

const consumeViaPostgres = async (email: string): Promise<{ allowed: boolean; snapshot: DailyUsageSnapshot }> => {
  await ensureQuotaTables(email);

  return runWithUserContext(email, async (client) => {
    await client.query(
      `with pref as (
        select daily_budget from public.ai_usage_preferences where owner_email = $1
      )
      insert into public.ai_daily_usage (owner_email, usage_date, used_requests, daily_budget)
      values ($1, current_date, 0, coalesce((select daily_budget from pref), $2))
      on conflict (owner_email, usage_date) do update set
        daily_budget = coalesce((select daily_budget from pref), public.ai_daily_usage.daily_budget),
        updated_at = now()`,
      [email, DEFAULT_DAILY_BUDGET],
    );

    const consume = await client.query(
      `update public.ai_daily_usage
       set used_requests = used_requests + 1,
           updated_at = now()
       where owner_email = $1
         and usage_date = current_date
         and used_requests < daily_budget
       returning used_requests, daily_budget, usage_date::text as usage_date`,
      [email],
    );

    if (consume.rows[0]) {
      const row = consume.rows[0];
      return { allowed: true, snapshot: toSnapshot(row.used_requests, row.daily_budget, row.usage_date, "postgres") };
    }

    const current = await client.query(
      `select used_requests, daily_budget, usage_date::text as usage_date
       from public.ai_daily_usage
       where owner_email = $1 and usage_date = current_date
       limit 1`,
      [email],
    );

    const row = current.rows[0] ?? { used_requests: 0, daily_budget: DEFAULT_DAILY_BUDGET, usage_date: usageDateKey() };
    return {
      allowed: false,
      snapshot: toSnapshot(row.used_requests, row.daily_budget, row.usage_date, "postgres"),
    };
  });
};

const setBudgetViaPostgres = async (email: string, dailyBudget: number): Promise<DailyUsageSnapshot> => {
  await ensureQuotaTables(email);

  return runWithUserContext(email, async (client) => {
    await client.query(
      `insert into public.ai_usage_preferences (owner_email, daily_budget)
       values ($1, $2)
       on conflict (owner_email) do update set
         daily_budget = excluded.daily_budget,
         updated_at = now()`,
      [email, dailyBudget],
    );

    const result = await client.query(
      `insert into public.ai_daily_usage (owner_email, usage_date, used_requests, daily_budget)
       values ($1, current_date, 0, $2)
       on conflict (owner_email, usage_date) do update set
         daily_budget = excluded.daily_budget,
         updated_at = now()
       returning used_requests, daily_budget, usage_date::text as usage_date`,
      [email, dailyBudget],
    );

    const row = result.rows[0];
    return toSnapshot(row.used_requests, row.daily_budget, row.usage_date, "postgres");
  });
};

const getSnapshotViaSupabase = async (email: string): Promise<DailyUsageSnapshot> => {
  const client = getSupabaseDataClient();

  const prefResult = await client
    .from("ai_usage_preferences")
    .select("daily_budget")
    .eq("owner_email", email)
    .maybeSingle();

  if (prefResult.error && prefResult.error.code !== "PGRST116") {
    throw new Error(prefResult.error.message || "Failed to load quota preference.");
  }

  const dailyBudget = prefResult.data?.daily_budget ?? budgetMemory.get(email) ?? DEFAULT_DAILY_BUDGET;
  const day = usageDateKey();

  const usageResult = await client
    .from("ai_daily_usage")
    .upsert(
      {
        owner_email: email,
        usage_date: day,
        used_requests: 0,
        daily_budget: dailyBudget,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_email,usage_date" },
    )
    .select("used_requests,daily_budget,usage_date")
    .single();

  if (usageResult.error) {
    throw new Error(usageResult.error.message || "Failed to load quota usage.");
  }

  return toSnapshot(usageResult.data.used_requests, usageResult.data.daily_budget, String(usageResult.data.usage_date), "supabase");
};

const consumeViaSupabase = async (email: string): Promise<{ allowed: boolean; snapshot: DailyUsageSnapshot }> => {
  const client = getSupabaseDataClient();
  const day = usageDateKey();

  const prefResult = await client
    .from("ai_usage_preferences")
    .select("daily_budget")
    .eq("owner_email", email)
    .maybeSingle();

  const dailyBudget = prefResult.data?.daily_budget ?? budgetMemory.get(email) ?? DEFAULT_DAILY_BUDGET;

  const currentResult = await client
    .from("ai_daily_usage")
    .upsert(
      {
        owner_email: email,
        usage_date: day,
        used_requests: 0,
        daily_budget: dailyBudget,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_email,usage_date" },
    )
    .select("used_requests,daily_budget,usage_date")
    .single();

  if (currentResult.error) {
    throw new Error(currentResult.error.message || "Failed to read current quota usage.");
  }

  const current = currentResult.data;
  if (current.used_requests >= current.daily_budget) {
    return {
      allowed: false,
      snapshot: toSnapshot(current.used_requests, current.daily_budget, String(current.usage_date), "supabase"),
    };
  }

  const updateResult = await client
    .from("ai_daily_usage")
    .update({
      used_requests: current.used_requests + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_email", email)
    .eq("usage_date", day)
    .select("used_requests,daily_budget,usage_date")
    .single();

  if (updateResult.error) {
    throw new Error(updateResult.error.message || "Failed to consume quota usage.");
  }

  const updated = updateResult.data;
  return {
    allowed: true,
    snapshot: toSnapshot(updated.used_requests, updated.daily_budget, String(updated.usage_date), "supabase"),
  };
};

const setBudgetViaSupabase = async (email: string, dailyBudget: number): Promise<DailyUsageSnapshot> => {
  const client = getSupabaseDataClient();
  const day = usageDateKey();

  const prefResult = await client
    .from("ai_usage_preferences")
    .upsert(
      {
        owner_email: email,
        daily_budget: dailyBudget,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_email" },
    )
    .select("daily_budget")
    .single();

  if (prefResult.error) {
    throw new Error(prefResult.error.message || "Failed to save quota preference.");
  }

  const usageResult = await client
    .from("ai_daily_usage")
    .upsert(
      {
        owner_email: email,
        usage_date: day,
        used_requests: 0,
        daily_budget: dailyBudget,
      },
      { onConflict: "owner_email,usage_date" },
    )
    .select("used_requests,daily_budget,usage_date")
    .single();

  if (usageResult.error) {
    throw new Error(usageResult.error.message || "Failed to sync current usage row.");
  }

  return toSnapshot(usageResult.data.used_requests, usageResult.data.daily_budget, String(usageResult.data.usage_date), "supabase");
};

const getSnapshotFromMemory = (email: string): DailyUsageSnapshot => {
  const day = usageDateKey();
  const key = `${email}:${day}`;
  const budget = budgetMemory.get(email) ?? DEFAULT_DAILY_BUDGET;
  const row = usageMemory.get(key) ?? { usedRequests: 0, dailyBudget: budget };
  usageMemory.set(key, row);
  return toSnapshot(row.usedRequests, row.dailyBudget, day, "memory");
};

const consumeFromMemory = (email: string): { allowed: boolean; snapshot: DailyUsageSnapshot } => {
  const day = usageDateKey();
  const key = `${email}:${day}`;
  const budget = budgetMemory.get(email) ?? DEFAULT_DAILY_BUDGET;
  const row = usageMemory.get(key) ?? { usedRequests: 0, dailyBudget: budget };

  if (row.usedRequests >= row.dailyBudget) {
    usageMemory.set(key, row);
    return { allowed: false, snapshot: toSnapshot(row.usedRequests, row.dailyBudget, day, "memory") };
  }

  const next = { ...row, usedRequests: row.usedRequests + 1 };
  usageMemory.set(key, next);
  return { allowed: true, snapshot: toSnapshot(next.usedRequests, next.dailyBudget, day, "memory") };
};

const setBudgetInMemory = (email: string, dailyBudget: number): DailyUsageSnapshot => {
  budgetMemory.set(email, dailyBudget);
  const day = usageDateKey();
  const key = `${email}:${day}`;
  const current = usageMemory.get(key) ?? { usedRequests: 0, dailyBudget };
  const next = { ...current, dailyBudget };
  usageMemory.set(key, next);
  return toSnapshot(next.usedRequests, next.dailyBudget, day, "memory");
};

export async function getDailyUsageSnapshot(email: string): Promise<DailyUsageSnapshot> {
  try {
    return await getSnapshotViaPostgres(email);
  } catch {
    try {
      return await getSnapshotViaSupabase(email);
    } catch {
      return getSnapshotFromMemory(email);
    }
  }
}

export async function consumeDailyRequest(email: string): Promise<{ allowed: boolean; snapshot: DailyUsageSnapshot }> {
  try {
    return await consumeViaPostgres(email);
  } catch {
    try {
      return await consumeViaSupabase(email);
    } catch {
      return consumeFromMemory(email);
    }
  }
}

export async function setDailyBudget(email: string, dailyBudget: number): Promise<DailyUsageSnapshot> {
  const normalized = Math.min(500, Math.max(1, Math.floor(dailyBudget)));
  try {
    return await setBudgetViaPostgres(email, normalized);
  } catch {
    try {
      return await setBudgetViaSupabase(email, normalized);
    } catch {
      return setBudgetInMemory(email, normalized);
    }
  }
}
