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

export const DEMO_MODE = false;

export function daysBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (current <= last) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function fetchTrips(userId: string): Promise<Trip[]> {
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
  const { data, error } = await supabase
    .from("trips")
    .select("*, trip_days(*, trip_items(*))")
    .eq("id", tripId)
    .single();
  if (error) throw error;
  const trip = data as TripWithDaysAndItems;

  // Auto-repair: create missing trip_day rows for dates in range
  if (trip.start_date && trip.end_date) {
    const expectedDates = daysBetween(trip.start_date, trip.end_date);
    const existingDates = new Set(trip.trip_days.map((d) => d.date).filter(Boolean));
    const missing = expectedDates.filter((d) => !existingDates.has(d));

    if (missing.length > 0) {
      const toInsert = missing.map((date) => ({
        trip_id: tripId,
        day_number: expectedDates.indexOf(date) + 1,
        date,
      }));
      await supabase.from("trip_days").insert(toInsert);

      // Re-number all days to match correct date order
      const { data: allDays } = await supabase
        .from("trip_days")
        .select("id, date")
        .eq("trip_id", tripId)
        .order("date", { ascending: true });
      if (allDays) {
        for (let i = 0; i < allDays.length; i++) {
          await supabase.from("trip_days").update({ day_number: i + 1 }).eq("id", allDays[i].id);
        }
      }

      // Re-fetch with the new days
      const { data: fresh, error: freshErr } = await supabase
        .from("trips")
        .select("*, trip_days(*, trip_items(*))")
        .eq("id", tripId)
        .single();
      if (!freshErr && fresh) {
        const freshTrip = fresh as TripWithDaysAndItems;
        freshTrip.trip_days.sort((a, b) => a.day_number - b.day_number);
        freshTrip.trip_days.forEach((day) => {
          day.trip_items.sort((a, b) => a.sort_order - b.sort_order);
        });
        return freshTrip;
      }
    }
  }

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
  const { data, error } = await supabase
    .from("trips")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTripDates(
  tripId: string,
  startDate: string,
  endDate: string
): Promise<Trip> {
  const newDates = daysBetween(startDate, endDate);

  // 1. Update the trip dates
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .update({ start_date: startDate, end_date: endDate, updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .select()
    .single();
  if (tripError) throw tripError;

  // 2. Fetch existing days
  const { data: existingDays, error: daysError } = await supabase
    .from("trip_days")
    .select("*, trip_items(id)")
    .eq("trip_id", tripId);
  if (daysError) throw daysError;

  const existingByDate = new Map((existingDays ?? []).filter((d: any) => d.date).map((d: any) => [d.date, d]));
  const newDateSet = new Set(newDates);

  // 3. Delete days that are no longer in range AND have no items
  const toDelete = (existingDays ?? []).filter(
    (d: any) => d.date && !newDateSet.has(d.date) && (!d.trip_items || d.trip_items.length === 0)
  );
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("trip_days")
      .delete()
      .in("id", toDelete.map((d: any) => d.id));
    if (error) throw error;
  }

  // 4. Insert new days that don't already exist
  const toInsert = newDates
    .filter((date) => !existingByDate.has(date))
    .map((date) => ({
      trip_id: tripId,
      day_number: newDates.indexOf(date) + 1,
      date,
    }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from("trip_days").insert(toInsert);
    if (error) throw error;
  }

  // 5. Re-number all days to match the new date order
  const { data: allDays } = await supabase
    .from("trip_days")
    .select("id, date")
    .eq("trip_id", tripId)
    .order("date", { ascending: true });
  if (allDays) {
    const shiftUp = allDays.map((d: any, i: number) =>
      supabase.from("trip_days").update({ day_number: i + 1000 }).eq("id", d.id)
    );
    await Promise.all(shiftUp);
    for (let i = 0; i < allDays.length; i++) {
      await supabase.from("trip_days").update({ day_number: i + 1 }).eq("id", allDays[i].id);
    }
  }

  return trip;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}

export async function createItem(
  input: CreateItemInput
): Promise<TripItem> {
  const { data: existing } = await supabase
    .from("trip_items")
    .select("sort_order")
    .eq("trip_day_id", input.trip_day_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  // Only send columns guaranteed to exist in the database
  const row: Record<string, any> = {
    trip_day_id: input.trip_day_id,
    sort_order: nextOrder,
    title: input.title,
  };
  if (input.subtitle) row.subtitle = input.subtitle;
  if (input.time) row.time = input.time;
  if (input.location_name) row.location_name = input.location_name;
  if (input.location_lat != null) row.location_lat = input.location_lat;
  if (input.location_lng != null) row.location_lng = input.location_lng;
  if (input.notes) row.notes = input.notes;

  const { data, error } = await supabase
    .from("trip_items")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(
  itemId: string,
  patch: UpdateItemInput
): Promise<TripItem> {
  // Only send columns that exist in the database
  const { category, link, photo_uri, assigned_to, ...safePatch } = patch as any;
  const { data, error } = await supabase
    .from("trip_items")
    .update(safePatch)
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(itemId: string): Promise<void> {
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
  const { error } = await supabase
    .from("trip_days")
    .update({ notes })
    .eq("id", dayId);
  if (error) throw error;
}
