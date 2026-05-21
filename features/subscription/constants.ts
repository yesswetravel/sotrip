export type SubscriptionTier = "free" | "paid";

export const TIER_LIMITS = {
  free: {
    activeTrips: 1,
    itemsPerTrip: 10,
    companions: 2,
    photosPerDay: 5,
    visiblePastTrips: 1,
    memoryBook: false,
    aiSuggestions: false,
    offlineAccess: false,
    pdfExport: false,
  },
  paid: {
    activeTrips: Infinity,
    itemsPerTrip: Infinity,
    companions: Infinity,
    photosPerDay: Infinity,
    visiblePastTrips: Infinity,
    memoryBook: true,
    aiSuggestions: true,
    offlineAccess: true,
    pdfExport: true,
  },
} as const;

export const PAID_PRICE_MONTHLY = 1.99;
