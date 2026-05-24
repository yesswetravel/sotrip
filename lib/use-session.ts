import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useSubscriptionStore } from "../features/subscription/store";

export function useSession() {
  const hydrate = useSubscriptionStore((s) => s.hydrate);
  const reset = useSubscriptionStore((s) => s.reset);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) {
        hydrate(data.session.user.id);
      }
      setLoading(false);
    }).catch(() => {
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
