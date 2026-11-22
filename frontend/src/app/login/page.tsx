"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Wordmark } from "@/components/landing/LandingPage";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";

type AuthOperation = "sign_up" | "signup_verify" | "confirmation_resend" | "sign_in" | "password_reset";

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
    return operation === "confirmation_resend"
      ? "Supabase could not deliver the verification email because its default sender is restricted to organization addresses. Configure custom SMTP, then request another code."
      : "Supabase could not deliver the verification email because its default sender is restricted to organization addresses. Configure custom SMTP, then create your account again.";
  }
  if (failure.code === "over_email_send_rate_limit" || failure.code === "over_request_rate_limit" || failure.status === 429) {
    return "Too many authentication requests were made. Wait before requesting another code, then try again.";
  }
  if (operation === "signup_verify" && ["otp_expired", "invalid_token", "invalid_otp"].includes(failure.code ?? "")) {
    return "That code is incorrect or expired. Check the latest email or request a new code.";
  }
  if (failure.code === "weak_password") {
    return "Choose a stronger password and try again. Use at least 8 characters and avoid a commonly used password.";
  }
  if (failure.code === "email_address_invalid") {
    return "Check the email address and try again.";
  }
  if (failure.code === "email_not_confirmed") {
    return "This address still needs confirmation. Request a new code below, then enter it here.";
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
  if (operation === "signup_verify") {
    return "We couldn’t verify that code. Check the digits and try again.";
  }
  if (operation === "confirmation_resend") {
    return "We couldn’t resend the code. Check the technical details below and try again.";
  }
  return "We couldn’t create your account. Check the technical details below and try again.";
}

function authDiagnostic(operation: AuthOperation, failure: AuthFailure) {
  const safeCode = failure.code?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return `${operation} · ${safeCode || "no provider code"} · ${failure.status ? `HTTP ${failure.status}` : "network or client error"}`;
}

function accountConfirmationUrl(origin: string) {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", "/dashboard?welcome=account-created");
  return url.toString();
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 1)}•••@${domain}`;
}

export default function LoginPage() {
  const router = useRouter();
  const supabaseConfigured = Boolean(getSupabaseConfig());
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
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
            emailRedirectTo: accountConfirmationUrl(window.location.origin),
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/dashboard?welcome=account-created");
          router.refresh();
        } else {
          setConfirmationEmail(email);
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
      if (operation === "sign_in" && failure.code === "email_not_confirmed") {
        const email = String(values.get("email") ?? "").trim();
        setConfirmationEmail(email);
        setPendingConfirmation(true);
      }
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

  async function verifySignupOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const token = String(values.get("signup_otp") ?? "").replace(/\D/g, "").slice(0, 6);
    setError("");
    setNotice("");
    setDiagnostic("");

    if (token.length !== 6) {
      setError("Enter the 6-digit code from your confirmation email.");
      return;
    }

    setPending(true);
    try {
      const { data, error: verifyError } = await createClient().auth.verifyOtp({
        email: confirmationEmail,
        token,
        type: "email",
      });
      if (verifyError) throw verifyError;
      if (!data.session) {
        setMode("sign-in");
        setPendingConfirmation(false);
        setNotice("Your email is confirmed. Sign in to open your Finora workspace.");
        return;
      }
      router.replace("/dashboard?welcome=account-created");
      router.refresh();
    } catch (cause) {
      const failure = readAuthFailure(cause);
      console.error("[Finora Auth] request failed", {
        operation: "signup_verify",
        code: failure.code,
        status: failure.status,
        name: failure.name,
      });
      setDiagnostic(authDiagnostic("signup_verify", failure));
      setError(authErrorMessage("signup_verify", failure));
    } finally {
      setPending(false);
    }
  }

  async function resendSignupOtp() {
    if (!confirmationEmail || pending) return;
    setError("");
    setNotice("");
    setDiagnostic("");
    setPending(true);
    try {
      const { error: resendError } = await createClient().auth.resend({
        type: "signup",
        email: confirmationEmail,
      });
      if (resendError) throw resendError;
      setNotice("If this address can receive a code, a new confirmation email is on its way. Use the latest code.");
    } catch (cause) {
      const failure = readAuthFailure(cause);
      console.error("[Finora Auth] request failed", {
        operation: "confirmation_resend",
        code: failure.code,
        status: failure.status,
        name: failure.name,
      });
      setDiagnostic(authDiagnostic("confirmation_resend", failure));
      setError(authErrorMessage("confirmation_resend", failure));
    } finally {
      setPending(false);
    }
  }

  function changeConfirmationEmail() {
    setPendingConfirmation(false);
    setConfirmationEmail("");
    setError("");
    setNotice("");
    setDiagnostic("");
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
        <h1>{pendingConfirmation ? "Confirm your email." : mode === "sign-in" ? "Come on in." : mode === "recover" ? "Reset your password." : "Create your account."}</h1>
        <p>
          {pendingConfirmation
            ? `Enter the 6-digit code sent to ${maskEmail(confirmationEmail)}. Your account stays protected until the address is confirmed.`
            : mode === "recover"
            ? "Enter the email address you used for Finora. We’ll send a reset link if an account can be found."
            : `${mode === "sign-up" ? "Create a Finora account to access your workspace." : "Sign in to your Finora account."} Finora does not connect to your bank. Your workspace starts empty until you add and confirm your own records.`}
        </p>
        {pendingConfirmation && <p role="status" className="login-confirmation-note">The code is valid for a limited time. If you don’t receive it, check spam or ask the project owner to configure the Supabase email sender.</p>}
        {!supabaseConfigured && (
          <p role="status" className="login-credentials">
            Add the Supabase project URL and publishable key to
            frontend/.env.local, then restart the dev server.
          </p>
        )}
        <form onSubmit={pendingConfirmation ? verifySignupOtp : submit}>
          {pendingConfirmation ? (
            <>
              <label htmlFor="signup_otp">6-digit email code</label>
              <input
                id="signup_otp"
                name="signup_otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="000000"
                aria-describedby={error ? "auth-message" : undefined}
              />
            </>
          ) : mode === "sign-up" ? (
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
          {!pendingConfirmation && <label htmlFor="email">Email</label>}
          {!pendingConfirmation && (
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
          )}
          {!pendingConfirmation && mode !== "recover" && <label htmlFor="password">Password</label>}
          {!pendingConfirmation && mode !== "recover" && (
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
            {pending ? "Please wait…" : pendingConfirmation ? "Verify and continue" : mode === "sign-in" ? "Sign in" : mode === "recover" ? "Send reset link" : "Create account"}
            {!pendingConfirmation && mode !== "recover" && <Arrow />}
          </button>
        </form>
        {notice && <p role="status" className="login-credentials">{notice}</p>}
        {pendingConfirmation && (
          <div className="login-confirmation-actions">
            <button type="button" onClick={resendSignupOtp} disabled={pending}>Resend code</button>
            <button type="button" onClick={changeConfirmationEmail} disabled={pending}>Use a different email</button>
          </div>
        )}
        {!pendingConfirmation && <div className="login-credentials">
          <span>{mode === "sign-up" ? "Already registered?" : mode === "recover" ? "Remembered your password?" : "New to Finora?"}</span>
          <button
            type="button"
            className="font-semibold text-[#4e342e] underline underline-offset-2"
            onClick={() => { setMode(mode === "sign-up" || mode === "recover" ? "sign-in" : "sign-up"); setError(""); setNotice(""); setDiagnostic(""); setPendingConfirmation(false); }}
          >
            {mode === "sign-up" || mode === "recover" ? "Sign in" : "Create an account"}
          </button>
        </div>}
        {mode === "sign-in" && <button type="button" className="login-recovery-link" onClick={() => { setMode("recover"); setError(""); setNotice(""); }}>Forgot password?</button>}
        <p className="demo-explanation">
          Sign-in uses Supabase Auth. Statement files are reviewed before
          import, and only the rows you confirm are saved to your account.
        </p>
      </section>
    </main>
  );
}
