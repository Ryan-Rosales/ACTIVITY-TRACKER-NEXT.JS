type SupabaseAuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
};

type SupabaseAdminUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase auth is not configured. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, anonKey };
};

const jsonHeaders = (anonKey: string, token?: string) => ({
  "Content-Type": "application/json",
  apikey: anonKey,
  Authorization: token ? `Bearer ${token}` : `Bearer ${anonKey}`,
});

const adminHeaders = (serviceRoleKey: string) => ({
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
});

export const hasSupabaseServiceRole = () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function adminCreateConfirmedUser(email: string, password: string, fullName?: string) {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for immediate-login signup.");
  }

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders(serviceRoleKey),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    }),
  });

  const data = (await response.json()) as SupabaseAdminUser & {
    error?: string;
    msg?: string;
  };

  if (!response.ok) {
    const message = data?.error ?? data?.msg ?? "Failed to create account.";
    throw new Error(message);
  }

  return data;
}

export async function signInWithPassword(email: string, password: string) {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: jsonHeaders(anonKey),
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json()) as SupabaseAuthResponse & { error_description?: string; msg?: string };

  if (!response.ok || !data.access_token || !data.user?.email) {
    throw new Error(data.error_description ?? data.msg ?? "Invalid email or password.");
  }

  return data;
}

export async function signUpWithPassword(email: string, password: string, fullName?: string) {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: jsonHeaders(anonKey),
    body: JSON.stringify({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    }),
  });

  const data = (await response.json()) as Partial<SupabaseAuthResponse> & { error_description?: string; msg?: string };

  if (!response.ok) {
    throw new Error(data.error_description ?? data.msg ?? "Sign up failed.");
  }

  return data;
}

export async function getSupabaseUser(accessToken: string) {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: jsonHeaders(anonKey, accessToken),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string };
  };

  if (!data.email) return null;

  return data;
}
