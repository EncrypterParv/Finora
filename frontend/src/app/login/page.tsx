"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
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
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, setPending] = useState(false);

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
          setNotice("Account created. Check your email to confirm it, then sign in.");
          setMode("sign-in");
        }
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Try again.");
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
            <span>Your financial position · sample data</span>
            <strong>₹1,48,500</strong>
            <small>Room for today. A plan for tomorrow.</small>
          </div>
        </div>
        <small>Clarity starts with understanding.</small>
      </section>
      <section className="login-form-panel">
        <Link href="/" className="login-back">
          <Arrow />
          Back to Finora
        </Link>
        <h1>{mode === "sign-in" ? "Come on in." : "Create your account."}</h1>
        <p>
          Sign in securely to explore the Finora prototype. No bank details are
          requested.
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
            aria-describedby="auth-message"
            aria-invalid={Boolean(error)}
          />
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              minLength={8}
              required
              placeholder="At least 8 characters"
              aria-describedby="auth-message"
              aria-invalid={Boolean(error)}
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
          {error && (
            <p id="auth-message" role="alert" className="login-error">
              {error}
            </p>
          )}
          <button className="landing-button" type="submit" disabled={pending}>
            {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
            <Arrow />
          </button>
        </form>
        {notice && <p role="status" className="login-credentials">{notice}</p>}
        <div className="login-credentials">
          <span>{mode === "sign-in" ? "New to Finora?" : "Already registered?"}</span>
          <button
            type="button"
            className="font-semibold text-[#4e342e] underline underline-offset-2"
            onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); setNotice(""); }}
          >
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </div>
        <p className="demo-explanation">
          Sign-in uses Supabase Auth. Dashboard content is still a prototype:
          financial figures are synthetic and prototype changes are not saved.
        </p>
      </section>
    </main>
  );
}
