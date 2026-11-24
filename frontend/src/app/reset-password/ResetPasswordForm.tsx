"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Arrow, Wordmark } from "@/components/landing/LandingBrand";
import { clearApiResponseCache } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";
import "@/components/landing/identity.css";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    try {
      createClient().auth.getUser().then(({ data, error: authError }) => {
        if (!active) return;
        setValidLink(Boolean(data.user) && !authError);
        setReady(true);
      }).catch(() => {
        if (active) setReady(true);
      });
    } catch {
      setReady(true);
    }
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    const confirmation = String(values.get("confirm_password") ?? "");
    setError("");
    setNotice("");
    if (password !== confirmation) {
      setError("Those passwords don’t match.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      clearApiResponseCache();
      setNotice("Your password has been changed. Sign in with your new password.");
      window.setTimeout(() => router.replace("/login"), 900);
    } catch {
      setError("We couldn’t update your password. Request a fresh reset link and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="finora-login">
      <section className="login-story">
        <Link href="/" aria-label="Finora home"><Wordmark /></Link>
        <div className="login-story-copy">
          <h2>A little perspective.<br /><em>A better next step.</em></h2>
          <p>Keep your account secure and your next step clear.</p>
        </div>
      </section>
      <section className="login-form-panel">
        <Link href="/login" className="login-back"><Arrow /> Back to sign in</Link>
        <h1>Choose a new password.</h1>
        <p>Use at least 8 characters. You’ll sign in again after it’s changed.</p>
        {!ready ? <p role="status" className="login-credentials">Checking your reset link…</p> : !validLink ? (
          <div className="login-reset-expired">
            <p role="alert" className="login-error">This reset link is invalid or has expired.</p>
            <Link className="landing-button" href="/login?mode=recover">Request another link <Arrow /></Link>
          </div>
        ) : (
          <form method="post" onSubmit={submit}>
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="reset-error" />
            <label htmlFor="confirm_password">Confirm new password</label>
            <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="reset-error" />
            {error && <p id="reset-error" role="alert" className="login-error">{error}</p>}
            <button className="landing-button" type="submit" disabled={pending}>{pending ? "Updating…" : "Update password"}<Arrow /></button>
          </form>
        )}
        {notice && <p role="status" className="login-credentials">{notice}</p>}
        <p className="demo-explanation">Password recovery is managed by Supabase Auth. Finora never sees or stores your password.</p>
      </section>
    </main>
  );
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

