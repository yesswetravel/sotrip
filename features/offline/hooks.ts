/**
 * Offline hooks — sync trip data to local storage and provide
 * network status awareness throughout the app.
 */

import { useEffect, useCallback, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineStore, saveOfflineCache, loadOfflineCache, clearOfflineCache } from "./store";
import { fetchTrips, fetchTrip } from "../trips/api";
import type { Trip, TripWithDaysAndItems } from "../../types/database";

/* ------------------------------------------------------------------ */
/*  Network status                                                      */
/* ------------------------------------------------------------------ */

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
}

/* ------------------------------------------------------------------ */
/*  Sync offline data                                                   */
/* ------------------------------------------------------------------ */

export function useOfflineSync(userId: string | undefined) {
  const { enabled, syncing, setSyncing, setLastSynced } = useOfflineStore();
  const qc = useQueryClient();
  const isOnline = useNetworkStatus();

  const sync = useCallback(async () => {
    if (!userId || !enabled || syncing || !isOnline) return;

    setSyncing(true);
    try {
      // 1. Fetch all trips
      const trips = await fetchTrips(userId);

      // 2. Fetch full details for each trip
      const tripDetails: Record<string, TripWithDaysAndItems> = {};
      for (const trip of trips) {
        try {
          const detail = await fetchTrip(trip.id);
          tripDetails[trip.id] = detail;

          // Also warm React Query cache
          qc.setQueryData(["trip", trip.id], detail);
        } catch {}
      }

      // 3. Save to local storage
      await saveOfflineCache({ trips, tripDetails });

      // 4. Update sync timestamp
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setLastSynced(ts);
    } catch {} finally {
      setSyncing(false);
    }
  }, [userId, enabled, syncing, isOnline, setSyncing, setLastSynced, qc]);

  // Auto-sync when offline mode is enabled and we're online
  useEffect(() => {
    if (enabled && isOnline && userId) {
      sync();
    }
  }, [enabled, isOnline, userId]);

  return { sync, syncing };
}

/* ------------------------------------------------------------------ */
/*  Load cached data when offline                                       */
/* ------------------------------------------------------------------ */

export function useOfflineFallback() {
  const { enabled } = useOfflineStore();
  const isOnline = useNetworkStatus();
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || isOnline) return;

    // We're offline + offline mode is on → load cache into React Query
    (async () => {
      const cache = await loadOfflineCache();
      if (!cache) return;

      // Populate trips list
      if (cache.trips.length > 0) {
        const userId = cache.trips[0].owner_id;
        qc.setQueryData(["trips", userId], cache.trips);
      }

      // Populate individual trip details
      for (const [tripId, detail] of Object.entries(cache.tripDetails)) {
        qc.setQueryData(["trip", tripId], detail);
      }
    })();
  }, [enabled, isOnline, qc]);
}

/* ------------------------------------------------------------------ */
/*  Toggle offline mode                                                 */
/* ------------------------------------------------------------------ */

export function useToggleOffline() {
  const { enabled, setEnabled } = useOfflineStore();

  const toggle = useCallback(async () => {
    if (enabled) {
      // Turning off — clear cached data
      setEnabled(false);
      await clearOfflineCache();
    } else {
      // Turning on — will trigger sync via useOfflineSync
      setEnabled(true);
    }
  }, [enabled, setEnabled]);

  return { enabled, toggle };
}
