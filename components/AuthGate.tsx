"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Landing from "./Landing";
import PodcastApp from "./PodcastApp";

export default function AuthGate() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "out" } | { status: "in"; email: string }
  >({ status: "loading" });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState(
        user?.email ? { status: "in", email: user.email } : { status: "out" },
      );
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email;
      setState(email ? { status: "in", email } : { status: "out" });
    });
    return () => subscription.unsubscribe();
  }, []);

  if (state.status === "loading") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (state.status === "out") {
    return <Landing />;
  }

  return (
    <PodcastApp
      userEmail={state.email}
      onSignOut={() => {
        void createClient()
          .auth.signOut()
          .then(() => window.location.assign("/"));
      }}
    />
  );
}
