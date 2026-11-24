"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Wordmark } from "@/components/landing/LandingBrand";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";
import "@/components/landing/identity.css";
import Image from "next/image";
type AuthOperation = "sign_up" | "sign_in" | "password_reset";

type AuthFailure = {
  code?: string;
  name?: string;
  status?: number;
};

function readAuthFailure(error: unknown): AuthFailure {
  if (typeof error !== "object" || error === null) {
    return error instanceof Error ? { name: error.name } : {};
  }

  const value = error as { code?: unknown; name?: unknown; status?: unknown };
  return {
    ...(typeof value.code === "string" ? { code: value.code } : {}),
    ...(typeof value.name === "string" ? { name: value.name } : {}),
    ...(typeof value.status === "number" ? { status: value.status } : {}),
  };
}

function authErrorMessage(operation: AuthOperation, failure: AuthFailure) {
  if (failure.code === "over_request_rate_limit" || failure.status === 429) {
    return "Supabase has temporarily rate-limited authentication requests from this browser or network. Wait before trying again; repeated attempts can extend the limit.";
  }
  if (failure.code === "weak_password") {
    return "Choose a stronger password and try again. Use at least 8 characters and avoid a commonly used password.";
  }
  if (failure.code === "email_address_invalid") {
    return "Check the email address and try again.";
  }
  if (failure.code === "email_not_confirmed") {
    return "This account was created while email confirmation was enabled. Turning confirmation off does not necessarily verify existing accounts; the project owner may need to confirm or recreate this account.";
  }
  if (failure.code === "signup_disabled" || failure.code === "email_provider_disabled") {
    return "Account creation is disabled in this Supabase project. Enable email sign-ups in Auth settings, then try again.";
  }
  if (failure.name === "AuthRetryableFetchError") {
    return "Finora could not reach Supabase. Check your connection and try again.";
  }
  if (failure.status !== undefined && failure.status >= 500) {
    return "Supabase could not complete this request. Check the Supabase Auth logs or try again shortly.";
  }
  if (operation === "sign_in") {
    return "Invalid email or password. If you’re new to Finora, create an account.";
  }
  if (operation === "password_reset") {
    return "If an account can be found for that email, we’ll send a password reset link.";
  }
  return "We couldn’t create your account. Check the technical details below and try again.";
}

function authDiagnostic(operation: AuthOperation, failure: AuthFailure) {
  const safeCode = failure.code?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return `${operation} · ${safeCode || "no provider code"} · ${failure.status ? `HTTP ${failure.status}` : "network or client error"}`;
}

export default function LoginPage() {
  const router = useRouter();
  const supabaseConfigured = Boolean(getSupabaseConfig());
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [diagnostic, setDiagnostic] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "recover">("sign-in");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("mode") === "recover") {
      setMode("recover");
    }
    if (url.searchParams.get("error") === "callback") {
      setError("That password-reset link could not be completed. Request a new reset link and try again.");
    }
    if (url.searchParams.get("signed-out") === "1") {
      setSignedOut(true);
      url.searchParams.delete("signed-out");
      window.history.replaceState(null, "", url);
    }
    setReady(true);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError("");
    setNotice("");
    setSignedOut(false);
    setDiagnostic("");
    if (!getSupabaseConfig()) {
      setError("Supabase is not configured yet. Add the project URL and publishable key to frontend/.env.local.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const email = String(values.get("email") ?? "").trim();
      const password = String(values.get("password") ?? "");

      if (mode === "recover") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (resetError) throw resetError;
        setNotice("If an account can be found for that email, we’ll send a password reset link.");
        return;
      }

      if (mode === "sign-up") {
        const fullName = String(values.get("full_name") ?? "").trim();
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, currency: "INR" },
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/dashboard?welcome=account-created");
          router.refresh();
        } else {
          setDiagnostic("sign_up · project_requires_confirmation · no session");
          setError("Supabase did not issue an active session. Email confirmation may still be enabled, or this email may already have an account. Check Auth settings; if you already registered, try signing in.");
        }
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      // Provider errors can contain request details, so log only operation,
      // provider code, status, and error class. Never log email or password.
      const operation: AuthOperation = mode === "sign-up" ? "sign_up" : mode === "recover" ? "password_reset" : "sign_in";
      const failure = readAuthFailure(cause);
      console.error("[Finora Auth] request failed", {
        operation,
        code: failure.code,
        status: failure.status,
        name: failure.name,
      });
      setDiagnostic(authDiagnostic(operation, failure));
      setError(authErrorMessage(operation, failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="finora-login">
      <section className="login-story">
        <Link href="/" aria-label="Finora home">
          <Wordmark />
        </Link>
        <div className="login-story-copy">
          <h2>
            A little perspective.
            <br />
            <em>A better next step.</em>
          </h2>
          <p>
            Your cash flow, spending habits, and goals. Together, in a picture
            you can actually use.
          </p>
          <div className="login-paper">
            <span>Your records, your decision</span>
            <strong>Review before saving</strong>
            <small>Finora never asks for your bank password or full account number.</small>
          </div>
        </div>
        <Image className="login-still-life" src="/images/savings-still-life.png" width={720} height={360} alt="" sizes="(max-width: 760px) 1px, 42vw" loading="eager" fetchPriority="high" />
      </section>
      <section className="login-form-panel">
        <Link href="/" className="login-back">
          <Arrow />
          Back to Finora
        </Link>
        <h1>{mode === "sign-in" ? "Come on in." : mode === "recover" ? "Reset your password." : "Create your account."}</h1>
        {signedOut && <div className="login-sign-out-notice" role="status">You’re signed out of Finora.</div>}
        <p>
          {mode === "recover"
            ? "Enter the email address you used for Finora. We’ll send a reset link if an account can be found."
            : mode === "sign-up"
              ? "Create a Finora account to access your workspace. Email addresses are not verified right now, so use one you can access if you need password recovery. Finora does not connect to your bank, and your workspace starts empty until you add your own records."
              : "Sign in to your Finora account. Finora does not connect to your bank. Your workspace starts empty until you add and confirm your own records."}
        </p>
        {!supabaseConfigured && (
          <p role="status" className="login-credentials">
            Add the Supabase project URL and publishable key to
            frontend/.env.local, then restart the dev server.
          </p>
        )}
        <form method="post" onSubmit={submit}>
          {mode === "sign-up" ? (
            <>
              <label htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                name="full_name"
                autoComplete="name"
                required
                placeholder="Your name"
              />
            </>
          ) : null}
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="you@example.com"
            aria-describedby={error ? "auth-message" : undefined}
          />
          {mode !== "recover" && <label htmlFor="password">Password</label>}
          {mode !== "recover" && (
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                minLength={mode === "sign-in" ? undefined : 8}
                required
                placeholder="At least 8 characters"
                aria-describedby={error ? "auth-message" : undefined}
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
              >
                {visible ? "Hide" : "Show"}
              </button>
            </div>
          )}
          {error && (
            <p id="auth-message" role="alert" className="login-error">
              {error}
            </p>
          )}
          {diagnostic && (
            <details className="login-diagnostic" open>
              <summary>Technical details to share</summary>
              <code>{diagnostic}</code>
              <span>No email address, password, or token is included.</span>
            </details>
          )}
          <button className="landing-button" type="submit" disabled={!ready || pending}>
            {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "recover" ? "Send reset link" : "Create account"}
            {mode !== "recover" && <Arrow />}
          </button>
        </form>
        {notice && <p role="status" className="login-credentials">{notice}</p>}
        <div className="login-credentials">
          <span>{mode === "sign-up" ? "Already registered?" : mode === "recover" ? "Back to sign in?" : "New to Finora?"}</span>
          <button
            type="button"
            className="font-semibold text-[#262724] underline underline-offset-2"
            onClick={() => { setMode(mode === "sign-up" || mode === "recover" ? "sign-in" : "sign-up"); setError(""); setNotice(""); setDiagnostic(""); }}
          >
            {mode === "sign-up" || mode === "recover" ? "Sign in" : "Create an account"}
          </button>
        </div>
        {mode === "sign-in" && <div className="login-auth-links">
          <button type="button" className="login-recovery-link" onClick={() => { setMode("recover"); setError(""); setNotice(""); setDiagnostic(""); }}>Forgot password?</button>
        </div>}
        <p className="demo-explanation">
          Sign-in uses Supabase Auth. Statement files are reviewed before
          import, and only the rows you confirm are saved to your account.
        </p>
        <Link href="/dashboard/demo" className="login-demo-skip" aria-label="Explore Finora without an account">
          Sign in later →
        </Link>
      </section>
    </main>
  );
}
