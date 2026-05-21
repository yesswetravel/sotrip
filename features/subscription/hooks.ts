import { useMemo } from "react";
import { useSubscriptionStore } from "./store";
import { TIER_LIMITS } from "./constants";
import type { Trip } from "../../types/database";

export function useSubscription() {
  const tier = useSubscriptionStore((s) => s.tier);
  const status = useSubscriptionStore((s) => s.status);
  const isPaid = tier === "paid" && status === "active";
  return { tier, status, isPaid };
}

export function useCanCreateTrip(currentTripCount: number) {
  const { tier } = useSubscription();
  const limit = TIER_LIMITS[tier].activeTrips;
  return {
    canCreate: currentTripCount < limit,
    limit,
    current: currentTripCount,
  };
}

export function useCanAddItem(currentItemCount: number) {
  const { tier } = useSubscription();
  const limit = TIER_LIMITS[tier].itemsPerTrip;
  return {
    canAdd: currentItemCount < limit,
    limit,
    current: currentItemCount,
  };
}

export function useVisiblePastTrips(allPastTrips: Trip[]) {
  const { tier } = useSubscription();
  const limit = TIER_LIMITS[tier].visiblePastTrips;

  return useMemo(() => {
    if (limit === Infinity) return allPastTrips;
    const sorted = [...allPastTrips].sort((a, b) => {
      const aDate = a.end_date ?? a.created_at;
      const bDate = b.end_date ?? b.created_at;
      return bDate.localeCompare(aDate);
    });
    return sorted.slice(0, limit);
  }, [allPastTrips, limit]);
}
