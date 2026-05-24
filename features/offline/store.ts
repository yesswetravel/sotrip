/**
 * Offline mode store — persists trip data locally so users can view
 * their plans without internet. Toggle on/off in trip settings.
 *
 * Uses manual AsyncStorage (NOT zustand/middleware persist).
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TripWithDaysAndItems, Trip } from "../../types/database";

const OFFLINE_KEY = "sotrip-offline";
const CACHE_KEY = "sotrip-offline-cache";

interface OfflineState {
  /** Whether offline mode is enabled globally */
  enabled: boolean;
  /** When data was last synced */
  lastSyncedAt: string | null;
  /** Whether a sync is currently running */
  syncing: boolean;

  /* Actions */
  setEnabled: (enabled: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSynced: (date: string) => void;
  hydrate: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  enabled: false,
  lastSyncedAt: null,
  syncing: false,

  setEnabled: (enabled) => {
    set({ enabled });
    _persist(get());
  },

  setSyncing: (syncing) => set({ syncing }),

  setLastSynced: (date) => {
    set({ lastSyncedAt: date });
    _persist(get());
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          enabled: data.enabled ?? false,
          lastSyncedAt: data.lastSyncedAt ?? null,
        });
      }
    } catch {}
  },
}));

function _persist(state: OfflineState) {
  AsyncStorage.setItem(
    OFFLINE_KEY,
    JSON.stringify({
      enabled: state.enabled,
      lastSyncedAt: state.lastSyncedAt,
    })
  ).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Cached trip data                                                    */
/* ------------------------------------------------------------------ */

interface CachedData {
  trips: Trip[];
  tripDetails: Record<string, TripWithDaysAndItems>;
}

export async function saveOfflineCache(data: CachedData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export async function loadOfflineCache(): Promise<CachedData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function clearOfflineCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {}
}
