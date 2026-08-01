"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "./ui/Button";
import Field from "./ui/Field";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("auth_error");
  });

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  const signInWithGoogle = async () => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) setError(err.message);
  };

  return (
    <div className="w-full max-w-[380px]">
      {sent ? (
        <div role="status">
          <h1 className="font-display text-3xl leading-[1.1] text-ink">
            Check your email
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-2">
            We sent a sign-in link to {email}. Open it on this device.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-5 text-[13px] font-medium text-signal-ink underline underline-offset-[3px]"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl leading-[1.1] text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-2">
            No password. We&apos;ll email you a link that signs you in on this
            device.
          </p>
          <form onSubmit={sendMagicLink} className="mt-6 space-y-4">
            <Field
              label="Email"
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              type="submit"
              disabled={busy}
              className="min-h-[52px] w-full"
            >
              {busy ? "Sending…" : "Email me a link"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[12px] text-ink-4">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="secondary"
            onClick={() => void signInWithGoogle()}
            className="w-full"
          >
            Continue with Google
          </Button>

          <p className="mt-5 text-center text-[11px] text-ink-5">
            By continuing you agree to the{" "}
            <a href="/legal" className="text-signal-ink underline underline-offset-2">
              terms
            </a>
            .
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-[13px] text-signal-ink">
          {error}
        </p>
      )}
    </div>
  );
}
