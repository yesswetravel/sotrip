import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import type {
  Trip,
  TripDay,
  TripItem,
  TripWithDaysAndItems,
  CreateTripInput,
  CreateItemInput,
  UpdateItemInput,
} from "../../types/database";

export const DEMO_MODE = false; // matches BYPASS_AUTH in _layout.tsx — set false for production

async function isOffline(): Promise<boolean> {
  if (DEMO_MODE) return true;
  const { data } = await supabase.auth.getSession();
  return !data.session;
}

export function localId(): string {
  return "local-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function daysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const DEMO_TRIPS_KEY = "demo_trips";
function demoDetailKey(tripId: string) {
  return `demo_trip_${tripId}`;
}

async function loadDemoTrips(): Promise<Trip[]> {
  const raw = await AsyncStorage.getItem(DEMO_TRIPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveDemoTrips(trips: Trip[]) {
  await AsyncStorage.setItem(DEMO_TRIPS_KEY, JSON.stringify(trips));
}

async function loadDemoDetail(tripId: string): Promise<TripWithDaysAndItems | null> {
  const raw = await AsyncStorage.getItem(demoDetailKey(tripId));
  return raw ? JSON.parse(raw) : null;
}

async function saveDemoDetail(tripId: string, detail: TripWithDaysAndItems) {
  await AsyncStorage.setItem(demoDetailKey(tripId), JSON.stringify(detail));
}

export async function fetchTrips(userId: string): Promise<Trip[]> {
  if (await isOffline()) return loadDemoTrips();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", userId)
    .eq("is_archived", false)
    .order("start_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchTrip(tripId: string): Promise<TripWithDaysAndItems> {
  if (await isOffline()) {
    const detail = await loadDemoDetail(tripId);
    if (detail) return detail;
    throw new Error("offline");
  }
  const { data, error } = await supabase
    .from("trips")
    .select("*, trip_days(*, trip_items(*))")
    .eq("id", tripId)
    .single();
  if (error) throw error;
  const trip = data as TripWithDaysAndItems;
  trip.trip_days.sort((a, b) => a.day_number - b.day_number);
  trip.trip_days.forEach((day) => {
    day.trip_items.sort((a, b) => a.sort_order - b.sort_order);
  });
  return trip;
}

export async function createTrip(
  userId: string,
  input: CreateTripInput
): Promise<Trip> {
  if (await isOffline()) {
    const now = new Date().toISOString();
    const trip = {
      id: localId(),
      owner_id: userId,
      title: input.title,
      destination: input.destination,
      start_date: input.start_date,
      end_date: input.end_date,
      cover_photo_url: null,
      is_archived: false,
      created_at: now,
      updated_at: now,
    } as Trip;

    const dates = input.start_date && input.end_date
      ? daysBetween(input.start_date, input.end_date) : [];
    const detail: TripWithDaysAndItems = {
      ...trip,
      trip_days: dates.map((date, i) => ({
        id: localId(),
        trip_id: trip.id,
        day_number: i + 1,
        date,
        title: null,
        notes: null,
        trip_items: [],
      })),
    };

    const trips = await loadDemoTrips();
    trips.push(trip);
    await saveDemoTrips(trips);
    await saveDemoDetail(trip.id, detail);
    return trip;
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      owner_id: userId,
      title: input.title,
      destination: input.destination,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .select()
    .single();
  if (tripError) throw tripError;

  const dates = daysBetween(input.start_date, input.end_date);
  const days = dates.map((date, i) => ({
    trip_id: trip.id,
    day_number: i + 1,
    date,
  }));

  const { error: daysError } = await supabase.from("trip_days").insert(days);
  if (daysError) throw daysError;

  return trip;
}

export async function updateTrip(
  tripId: string,
  patch: Partial<Trip>
): Promise<Trip> {
  if (await isOffline()) {
    const updated = { id: tripId, ...patch, updated_at: new Date().toISOString() } as Trip;
    const trips = await loadDemoTrips();
    await saveDemoTrips(trips.map((t) => (t.id === tripId ? { ...t, ...updated } : t)));
    const detail = await loadDemoDetail(tripId);
    if (detail) await saveDemoDetail(tripId, { ...detail, ...updated });
    return updated;
  }
  const { data, error } = await supabase
    .from("trips")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTrip(tripId: string): Promise<void> {
  if (await isOffline()) {
    const trips = await loadDemoTrips();
    await saveDemoTrips(trips.filter((t) => t.id !== tripId));
    await AsyncStorage.removeItem(demoDetailKey(tripId));
    return;
  }
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}

export async function createItem(
  input: CreateItemInput
): Promise<TripItem> {
  if (await isOffline()) {
    const item = {
      id: localId(),
      trip_day_id: input.trip_day_id,
      sort_order: 0,
      title: input.title,
      subtitle: input.subtitle ?? null,
      time: input.time ?? null,
      location_name: input.location_name ?? null,
      location_lat: input.location_lat ?? null,
      location_lng: input.location_lng ?? null,
      category: input.category ?? null,
      notes: input.notes ?? null,
      link: input.link ?? null,
      photo_uri: input.photo_uri ?? null,
      assigned_to: [],
      created_at: new Date().toISOString(),
    } as TripItem;

    const allTrips = await loadDemoTrips();
    for (const trip of allTrips) {
      const detail = await loadDemoDetail(trip.id);
      if (!detail) continue;
      const day = detail.trip_days.find((d) => d.id === input.trip_day_id);
      if (day) {
        item.sort_order = day.trip_items.length;
        day.trip_items.push(item);
        await saveDemoDetail(trip.id, detail);
        break;
      }
    }
    return item;
  }

  const { data: existing } = await supabase
    .from("trip_items")
    .select("sort_order")
    .eq("trip_day_id", input.trip_day_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("trip_items")
    .insert({
      trip_day_id: input.trip_day_id,
      sort_order: nextOrder,
      title: input.title,
      subtitle: input.subtitle ?? null,
      time: input.time ?? null,
      location_name: input.location_name ?? null,
      location_lat: input.location_lat ?? null,
      location_lng: input.location_lng ?? null,
      category: input.category ?? null,
      notes: input.notes ?? null,
      link: input.link ?? null,
      photo_uri: input.photo_uri ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(
  itemId: string,
  patch: UpdateItemInput
): Promise<TripItem> {
  if (await isOffline()) {
    const allTrips = await loadDemoTrips();
    for (const trip of allTrips) {
      const detail = await loadDemoDetail(trip.id);
      if (!detail) continue;
      for (const day of detail.trip_days) {
        const idx = day.trip_items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          day.trip_items[idx] = { ...day.trip_items[idx], ...patch };
          await saveDemoDetail(trip.id, detail);
          return day.trip_items[idx];
        }
      }
    }
    return { id: itemId, ...patch } as TripItem;
  }
  const { data, error } = await supabase
    .from("trip_items")
    .update(patch)
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(itemId: string): Promise<void> {
  if (await isOffline()) {
    const allTrips = await loadDemoTrips();
    for (const trip of allTrips) {
      const detail = await loadDemoDetail(trip.id);
      if (!detail) continue;
      for (const day of detail.trip_days) {
        const idx = day.trip_items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          day.trip_items.splice(idx, 1);
          await saveDemoDetail(trip.id, detail);
          return;
        }
      }
    }
    return;
  }
  const { error } = await supabase
    .from("trip_items")
    .delete()
    .eq("id", itemId);
  if (error) throw error;
}

export async function reorderItems(
  dayId: string,
  orderedIds: string[]
): Promise<void> {
  if (await isOffline()) {
    const allTrips = await loadDemoTrips();
    for (const trip of allTrips) {
      const detail = await loadDemoDetail(trip.id);
      if (!detail) continue;
      const day = detail.trip_days.find((d) => d.id === dayId);
      if (day) {
        const itemMap = new Map(day.trip_items.map((i) => [i.id, i]));
        day.trip_items = orderedIds
          .map((id, i) => {
            const item = itemMap.get(id);
            return item ? { ...item, sort_order: i } : null;
          })
          .filter(Boolean) as TripItem[];
        await saveDemoDetail(trip.id, detail);
        return;
      }
    }
    return;
  }
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("trip_items")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("trip_day_id", dayId)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function updateDayNotes(
  dayId: string,
  notes: string
): Promise<void> {
  if (await isOffline()) {
    const allTrips = await loadDemoTrips();
    for (const trip of allTrips) {
      const detail = await loadDemoDetail(trip.id);
      if (!detail) continue;
      const day = detail.trip_days.find((d) => d.id === dayId);
      if (day) {
        day.notes = notes;
        await saveDemoDetail(trip.id, detail);
        return;
      }
    }
    return;
  }
  const { error } = await supabase
    .from("trip_days")
    .update({ notes })
    .eq("id", dayId);
  if (error) throw error;
}
