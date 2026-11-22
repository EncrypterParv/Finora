"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Wordmark } from "@/components/landing/LandingPage";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";

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
  if (failure.code === "email_address_not_authorized") {
    return operation === "sign_up"
      ? "Supabase blocked the confirmation email because this project uses its restricted default mailer. For this demo, turn off Confirm email in Supabase Auth settings, then try again."
      : "Supabase could not send this email from its restricted default mailer. Configure custom SMTP before using email recovery.";
  }
  if (failure.code === "over_email_send_rate_limit" || failure.code === "over_request_rate_limit" || failure.status === 429) {
    return "Too many authentication requests were made. Wait a little while, then try again.";
  }
  if (failure.code === "weak_password") {
    return "Choose a stronger password and try again. Use at least 8 characters and avoid a commonly used password.";
  }
  if (failure.code === "email_address_invalid") {
    return "Check the email address and try again.";
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
  const [diagnostic, setDiagnostic] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "recover">("sign-in");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "recover") {
      setMode("recover");
    }
    if (new URLSearchParams(window.location.search).get("error") === "confirmation") {
      setError("That email link could not be confirmed. Request a new link or try signing in again.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError("");
    setNotice("");
    setDiagnostic("");
    setPendingConfirmation(false);

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
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/dashboard?welcome=account-created");
          router.refresh();
        } else {
          setPendingConfirmation(true);
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
        <div>
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
        <small>Clarity starts with understanding.</small>
      </section>
      <section className="login-form-panel">
        <Link href="/" className="login-back">
          <Arrow />
          Back to Finora
        </Link>
        <h1>{pendingConfirmation ? "One more setup step." : mode === "sign-in" ? "Come on in." : mode === "recover" ? "Reset your password." : "Create your account."}</h1>
        <p>
          {pendingConfirmation
            ? "Supabase accepted the sign-up request, but this project is still asking for email confirmation. Finora cannot sign you in until that setting is changed."
            : mode === "recover"
            ? "Enter the email address you used for Finora. We’ll send a reset link if an account can be found."
            : `${mode === "sign-up" ? "Create a Finora account to access your workspace." : "Sign in to your Finora account."} Finora does not connect to your bank. Your workspace starts empty until you add and confirm your own records.`}
        </p>
        {pendingConfirmation && (
          <p role="status" className="login-confirmation-note">
            For this demo, the project owner can turn off <strong>Confirm email</strong> in Supabase under Authentication → Providers → Email. Then retry account creation here. Password recovery still needs working email delivery.
          </p>
        )}
        {!supabaseConfigured && (
          <p role="status" className="login-credentials">
            Add the Supabase project URL and publishable key to
            frontend/.env.local, then restart the dev server.
          </p>
        )}
        <form onSubmit={submit}>
          {mode === "sign-up" && (
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
          )}
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
            <details className="login-diagnostic">
              <summary>Technical details to share</summary>
              <code>{diagnostic}</code>
              <span>No email address, password, or token is included.</span>
            </details>
          )}
          <button className="landing-button" type="submit" disabled={pending}>
            {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : mode === "recover" ? "Send reset link" : "Create account"}
            {mode !== "recover" && <Arrow />}
          </button>
        </form>
        {notice && <p role="status" className="login-credentials">{notice}</p>}
        <div className="login-credentials">
          <span>{mode === "sign-up" ? "Already registered?" : mode === "recover" ? "Remembered your password?" : "New to Finora?"}</span>
          <button
            type="button"
            className="font-semibold text-[#4e342e] underline underline-offset-2"
            onClick={() => { setMode(mode === "sign-up" || mode === "recover" ? "sign-in" : "sign-up"); setError(""); setNotice(""); setDiagnostic(""); setPendingConfirmation(false); }}
          >
            {mode === "sign-up" || mode === "recover" ? "Sign in" : "Create an account"}
          </button>
        </div>
        {mode === "sign-in" && <button type="button" className="login-recovery-link" onClick={() => { setMode("recover"); setError(""); setNotice(""); }}>Forgot password?</button>}
        <p className="demo-explanation">
          Sign-in uses Supabase Auth. Statement files are reviewed before
          import, and only the rows you confirm are saved to your account.
        </p>
      </section>
    </main>
  );
}
