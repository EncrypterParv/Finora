"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Wordmark } from "@/components/landing/LandingPage";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";

export default function LoginPage() {
  const router = useRouter();
  const supabaseConfigured = Boolean(getSupabaseConfig());
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
          router.replace("/dashboard");
          router.refresh();
        } else {
          setNotice("If this email can be used, check your inbox for a confirmation link. You can sign in after confirming it.");
          setMode("sign-in");
        }
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace("/dashboard");
      router.refresh();
    } catch {
      // Keep provider errors private: distinguishing unknown addresses from bad
      // passwords enables account enumeration.
      setError(mode === "sign-in"
        ? "Invalid email or password. If you’re new to Finora, create an account."
        : mode === "recover"
          ? "We couldn’t send a reset request right now. Try again in a moment."
          : "We couldn’t create your account right now. Check your details and try again.");
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
        <h1>{mode === "sign-in" ? "Come on in." : mode === "recover" ? "Reset your password." : "Create your account."}</h1>
        <p>
          {mode === "recover"
            ? "Enter the email address you used for Finora. We’ll send a reset link if an account can be found."
            : `${mode === "sign-up" ? "Create a Finora account to access your workspace." : "Sign in to your Finora account."} Finora does not connect to your bank. Your workspace starts empty until you add and confirm your own records.`}
        </p>
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
            onClick={() => { setMode(mode === "sign-up" || mode === "recover" ? "sign-in" : "sign-up"); setError(""); setNotice(""); }}
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
