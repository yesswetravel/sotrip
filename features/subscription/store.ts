import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import type { SubscriptionTier } from "./constants";

const STORAGE_KEY = "sotrip-subscription";

interface PersistedState {
  tier: SubscriptionTier;
  status: "active" | "cancelled" | "expired";
  hasSeenPaywall: boolean;
}

interface SubscriptionState extends PersistedState {
  setTier: (tier: SubscriptionTier) => void;
  markPaywallSeen: () => void;
  hydrate: (userId: string) => Promise<void>;
  reset: () => void;
  _persist: (partial: Partial<PersistedState>) => void;
}

async function save(state: PersistedState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

async function load(): Promise<Partial<PersistedState>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  tier: "free",
  status: "active",
  hasSeenPaywall: false,

  _persist: (partial) => {
    set(partial);
    const { tier, status, hasSeenPaywall } = { ...get(), ...partial };
    save({ tier, status, hasSeenPaywall });
  },

  setTier: (tier) => get()._persist({ tier }),

  markPaywallSeen: () => get()._persist({ hasSeenPaywall: true }),

  hydrate: async (userId: string) => {
    const persisted = await load();
    if (persisted.hasSeenPaywall !== undefined) {
      set({ hasSeenPaywall: persisted.hasSeenPaywall });
    }

    const { data } = await supabase
      .from("users")
      .select("subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    if (data) {
      get()._persist({
        tier: (data.subscription_tier as SubscriptionTier) ?? "free",
        status: data.subscription_status ?? "active",
      });
    } else if (persisted.tier) {
      set({ tier: persisted.tier, status: persisted.status ?? "active" });
    }
  },

  reset: () => {
    set({ tier: "free", status: "active", hasSeenPaywall: false });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
