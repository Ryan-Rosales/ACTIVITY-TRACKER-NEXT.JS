import { NextResponse } from "next/server";
import {
  adminCreateConfirmedUser,
  hasSupabaseServiceRole,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/server/supabaseAuth";

export async function POST(request: Request) {
  let email = "";
  let password = "";
  let fullName = "";
  let usedSignupFallback = false;
  let accountCreated = false;

  try {
    const body = await request.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "").trim();
    fullName = String(body.fullName ?? "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    let session: Awaited<ReturnType<typeof signInWithPassword>>;

    if (hasSupabaseServiceRole()) {
      try {
        await adminCreateConfirmedUser(email, password, fullName || undefined);
        accountCreated = true;
      } catch (adminCreateError) {
        const adminMessage = adminCreateError instanceof Error ? adminCreateError.message.toLowerCase() : "";
        const alreadyExists = adminMessage.includes("already") && adminMessage.includes("register");

        if (!alreadyExists) {
          throw adminCreateError;
        }
      }

      try {
        session = await signInWithPassword(email, password);
      } catch (signInError) {
        const signInMessage = signInError instanceof Error ? signInError.message.toLowerCase() : "";
        if (signInMessage.includes("invalid login credentials")) {
          return NextResponse.json(
            {
              error: "This email is already registered with a different password. Use Sign in or reset your password.",
            },
            { status: 400 },
          );
        }

        throw signInError;
      }
    } else {
      try {
        await signUpWithPassword(email, password, fullName || undefined);
        accountCreated = true;
      } catch (signupError) {
        const signupMessage = signupError instanceof Error ? signupError.message.toLowerCase() : "";
        const canFallbackToSignIn =
          signupMessage.includes("rate limit") ||
          signupMessage.includes("over_email_send_rate_limit") ||
          signupMessage.includes("already registered") ||
          signupMessage.includes("user already registered");

        if (!canFallbackToSignIn) {
          throw signupError;
        }

        usedSignupFallback = true;
      }

      try {
        session = await signInWithPassword(email, password);
      } catch (signInError) {
        const signInMessage = signInError instanceof Error ? signInError.message.toLowerCase() : "";

        if (accountCreated && signInMessage.includes("email not confirmed")) {
          return NextResponse.json(
            {
              error:
                "Supabase email confirmation is enabled. Disable Confirm email in Auth > Providers > Email, or set SUPABASE_SERVICE_ROLE_KEY for instant signup.",
            },
            { status: 400 },
          );
        }

        if (usedSignupFallback && signInMessage.includes("invalid login credentials")) {
          return NextResponse.json(
            {
              error: "This email is already registered with a different password. Use Sign in or reset your password.",
            },
            { status: 400 },
          );
        }

        throw signInError;
      }
    }

    const signedInName =
      (session.user.user_metadata?.full_name ?? fullName) ||
      email.split("@")[0]?.replace(/\./g, " ") ||
      "User";

    const response = NextResponse.json({
      user: {
        email: session.user.email,
        name: signedInName,
      },
      message: accountCreated ? "Account created and signed in." : "Signed in successfully.",
    });

    response.cookies.set("auth_token", session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set("activity_user_email", session.user.email.toLowerCase(), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed.";
    if (message.toLowerCase().includes("email not confirmed")) {
      return NextResponse.json(
        {
          error:
            "Immediate login after signup requires SUPABASE_SERVICE_ROLE_KEY or disabling Confirm email in Supabase Auth settings.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
