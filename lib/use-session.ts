import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useSubscriptionStore } from "../features/subscription/store";
import { DEMO_MODE } from "../features/trips/api";

const DEMO_SESSION = {
  access_token: "demo",
  token_type: "bearer",
  expires_in: 0,
  refresh_token: "demo",
  user: {
    id: "demo-user",
    aud: "authenticated",
    role: "authenticated",
    email: "demo@sotrip.app",
    app_metadata: {},
    user_metadata: { display_name: "Traveller" },
    created_at: new Date().toISOString(),
  },
} as Session;

export function useSession() {
  const demoSignedIn = useSubscriptionStore((s) => s.demoSignedIn);
  const hydrate = useSubscriptionStore((s) => s.hydrate);
  const reset = useSubscriptionStore((s) => s.reset);

  // In demo mode, session is derived from the Zustand flag (reactive)
  const [session, setSession] = useState<Session | null>(
    DEMO_MODE && demoSignedIn ? DEMO_SESSION : null,
  );
  const [loading, setLoading] = useState(DEMO_MODE ? false : true);

  // React to demoSignedIn changing
  useEffect(() => {
    if (DEMO_MODE) {
      if (demoSignedIn) {
        setSession(DEMO_SESSION);
        hydrate("demo-user");
      } else {
        setSession(null);
      }
      return;
    }
  }, [demoSignedIn]);

  // Real Supabase auth (only when not in demo mode)
  useEffect(() => {
    if (DEMO_MODE) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) {
        hydrate(data.session.user.id);
      }
      setLoading(false);
    }).catch(() => {
      // Network or auth error — stop loading so the app renders sign-in
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user.id) {
        hydrate(s.user.id);
      } else {
        reset();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
