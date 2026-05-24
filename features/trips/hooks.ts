import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import {
  fetchTrips,
  fetchTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  updateTripDates,
  updateDayNotes,
  DEMO_MODE,
} from "./api";
import type {
  Trip,
  TripWithDaysAndItems,
  CreateTripInput,
  CreateItemInput,
  UpdateItemInput,
} from "../../types/database";

export function useTrips(userId: string | undefined) {
  return useQuery({
    queryKey: ["trips", userId],
    queryFn: () => fetchTrips(userId!),
    enabled: !!userId,
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => fetchTrip(tripId!),
    enabled: !!tripId,
  });
}

/** Prefetch full trip detail so the next screen loads instantly */
export function usePrefetchTrips(trips: Trip[] | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!trips) return;
    trips.forEach((trip) => {
      qc.prefetchQuery({
        queryKey: ["trip", trip.id],
        queryFn: () => fetchTrip(trip.id),
        staleTime: 1000 * 60 * 5,
      });
    });
  }, [trips, qc]);
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: CreateTripInput }) =>
      createTrip(userId, input),
    onSuccess: async (newTrip, { userId }) => {
      if (DEMO_MODE) {
        qc.setQueryData<Trip[]>(["trips", userId], (old) => [...(old || []), newTrip]);
        const detail = await fetchTrip(newTrip.id);
        qc.setQueryData(["trip", newTrip.id], detail);
        return;
      }
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, patch }: { tripId: string; patch: Partial<Trip> }) =>
      updateTrip(tripId, patch),
    onSuccess: (updatedTrip, { tripId }) => {
      if (DEMO_MODE) {
        qc.setQueriesData<Trip[]>({ queryKey: ["trips"] }, (old) =>
          old?.map((t) => (t.id === tripId ? { ...t, ...updatedTrip } : t)) || []
        );
        qc.setQueryData<TripWithDaysAndItems>(["trip", tripId], (old) =>
          old ? { ...old, ...updatedTrip } : undefined
        );
        return;
      }
      qc.invalidateQueries({ queryKey: ["trip", tripId] });
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTripDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, startDate, endDate }: { tripId: string; startDate: string; endDate: string }) =>
      updateTripDates(tripId, startDate, endDate),
    onSuccess: (_, { tripId }) => {
      qc.invalidateQueries({ queryKey: ["trip", tripId] });
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => deleteTrip(tripId),
    onSuccess: (_data, tripId) => {
      if (DEMO_MODE) {
        qc.setQueriesData<Trip[]>({ queryKey: ["trips"] }, (old) =>
          old?.filter((t) => t.id !== tripId) || []
        );
        qc.removeQueries({ queryKey: ["trip", tripId] });
        return;
      }
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useCreateItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["trip", tripId] });
      const prev = qc.getQueryData<TripWithDaysAndItems>(["trip", tripId]);
      if (prev) {
        const optimistic = {
          ...prev,
          trip_days: prev.trip_days.map((day) =>
            day.id === input.trip_day_id
              ? {
                  ...day,
                  trip_items: [
                    ...day.trip_items,
                    {
                      id: `temp-${Date.now()}`,
                      trip_day_id: input.trip_day_id,
                      sort_order: day.trip_items.length,
                      title: input.title,
                      subtitle: input.subtitle ?? null,
                      time: input.time ?? null,
                      location_name: input.location_name ?? null,
                      location_lat: null,
                      location_lng: null,
                      notes: input.notes ?? null,
                      link: input.link ?? null,
                      photo_uri: input.photo_uri ?? null,
                      assigned_to: [],
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : day
          ),
        };
        qc.setQueryData(["trip", tripId], optimistic);
      }
      return { prev };
    },
    onError: (_err, _input, context) => {
      if (context?.prev) qc.setQueryData(["trip", tripId], context.prev);
    },
    onSettled: () => {
      if (!DEMO_MODE) qc.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

export function useUpdateItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: UpdateItemInput }) =>
      updateItem(itemId, patch),
    onMutate: async ({ itemId, patch }) => {
      await qc.cancelQueries({ queryKey: ["trip", tripId] });
      const prev = qc.getQueryData<TripWithDaysAndItems>(["trip", tripId]);
      if (prev) {
        const optimistic = {
          ...prev,
          trip_days: prev.trip_days.map((day) => ({
            ...day,
            trip_items: day.trip_items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item
            ),
          })),
        };
        qc.setQueryData(["trip", tripId], optimistic);
      }
      return { prev };
    },
    onError: (_err, _input, context) => {
      if (context?.prev) qc.setQueryData(["trip", tripId], context.prev);
    },
    onSettled: () => {
      if (!DEMO_MODE) qc.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

export function useDeleteItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onMutate: async (itemId) => {
      await qc.cancelQueries({ queryKey: ["trip", tripId] });
      const prev = qc.getQueryData<TripWithDaysAndItems>(["trip", tripId]);
      if (prev) {
        const optimistic = {
          ...prev,
          trip_days: prev.trip_days.map((day) => ({
            ...day,
            trip_items: day.trip_items.filter((item) => item.id !== itemId),
          })),
        };
        qc.setQueryData(["trip", tripId], optimistic);
      }
      return { prev };
    },
    onError: (_err, _input, context) => {
      if (context?.prev) qc.setQueryData(["trip", tripId], context.prev);
    },
    onSettled: () => {
      if (!DEMO_MODE) qc.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

export function useReorderItems(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, orderedIds }: { dayId: string; orderedIds: string[] }) =>
      reorderItems(dayId, orderedIds),
    onMutate: async ({ dayId, orderedIds }) => {
      await qc.cancelQueries({ queryKey: ["trip", tripId] });
      const prev = qc.getQueryData<TripWithDaysAndItems>(["trip", tripId]);
      if (prev) {
        const optimistic = {
          ...prev,
          trip_days: prev.trip_days.map((day) => {
            if (day.id !== dayId) return day;
            const itemMap = new Map(day.trip_items.map((item) => [item.id, item]));
            return {
              ...day,
              trip_items: orderedIds
                .map((id, i) => {
                  const item = itemMap.get(id);
                  return item ? { ...item, sort_order: i } : null;
                })
                .filter(Boolean) as typeof day.trip_items,
            };
          }),
        };
        qc.setQueryData(["trip", tripId], optimistic);
      }
      return { prev };
    },
    onError: (_err, _input, context) => {
      if (context?.prev) qc.setQueryData(["trip", tripId], context.prev);
    },
    onSettled: () => {
      if (!DEMO_MODE) qc.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

export function useUpdateDayNotes(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, notes }: { dayId: string; notes: string }) =>
      updateDayNotes(dayId, notes),
    onMutate: async ({ dayId, notes }) => {
      await qc.cancelQueries({ queryKey: ["trip", tripId] });
      const prev = qc.getQueryData<TripWithDaysAndItems>(["trip", tripId]);
      if (prev) {
        const optimistic = {
          ...prev,
          trip_days: prev.trip_days.map((day) =>
            day.id === dayId ? { ...day, notes } : day
          ),
        };
        qc.setQueryData(["trip", tripId], optimistic);
      }
      return { prev };
    },
    onError: (_err, _input, context) => {
      if (context?.prev) qc.setQueryData(["trip", tripId], context.prev);
    },
    onSettled: () => {
      if (!DEMO_MODE) qc.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

export function useTripRealtime(tripId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (DEMO_MODE || !tripId) return;

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_days", filter: `trip_id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: ["trip", tripId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["trip", tripId] });
          qc.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe((status) => {
        // Silently ignore subscription errors — data still loads via REST
        if (status === "CHANNEL_ERROR") {
          supabase.removeChannel(channel);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, qc]);
}
