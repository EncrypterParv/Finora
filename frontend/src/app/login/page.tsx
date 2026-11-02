"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Wordmark } from "@/components/landing/LandingPage";
import { startDemoSession } from "@/lib/demo-session";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";

export default function LoginPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (
      values.get("username") !== "admin" ||
      values.get("password") !== "admin"
    ) {
      setError("Use admin for both username and password to open the demo.");
      return;
    }
    try {
      startDemoSession();
      setError("");
      setPending(true);
      router.push("/dashboard");
    } catch {
      setError(
        "Browser storage is unavailable. Enable session storage and try again.",
      );
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
        <h1>Come on in.</h1>
        <p>
          Explore your financial picture with a ready-to-use demo. No bank
          details required.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="Enter demo username"
            aria-describedby="demo-credentials"
            aria-invalid={Boolean(error)}
          />
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter demo password"
              aria-describedby="demo-credentials"
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
            <p role="alert" className="login-error">
              {error}
            </p>
          )}
          <button className="landing-button" type="submit" disabled={pending}>
            {pending ? "Opening your overview…" : "Open my financial overview"}
            <Arrow />
          </button>
        </form>
        <div className="login-credentials" id="demo-credentials">
          <span>Demo credentials</span>
          <code>admin / admin</code>
        </div>
        <p className="demo-explanation">
          Frontend preview only. This demo login isn’t secure authentication.
          All financial figures are synthetic; changes reset when this session
          ends.
        </p>
      </section>
    </main>
  );
}
