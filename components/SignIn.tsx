"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      {sent ? (
        <div role="status" className="text-center">
          <p className="font-medium text-zinc-100">Check your email</p>
          <p className="mt-1 text-sm text-zinc-400">
            We sent a sign-in link to {email}. Open it on this device.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-4 text-sm text-violet-400 hover:text-violet-300"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-center text-sm font-medium text-zinc-200">
            Start free — 5 episodes on us
          </p>
          <form onSubmit={sendMagicLink} className="space-y-3">
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-zinc-600">
            <span className="h-px flex-1 bg-zinc-800" />
            or
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-3 font-medium text-zinc-100 hover:border-zinc-500"
          >
            Continue with Google
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
