import { supabase } from "../../lib/supabase";
import type { Photo } from "../../types/photos";

export async function fetchPhotosByDay(dayId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("trip_day_id", dayId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchPhotosByTrip(tripId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updatePhoto(
  photoId: string,
  patch: Partial<Pick<Photo, "caption" | "trip_day_id" | "trip_item_id" | "sort_order">>
): Promise<Photo> {
  const { data, error } = await supabase
    .from("photos")
    .update(patch)
    .eq("id", photoId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePhoto(photoId: string, storagePath: string): Promise<void> {
  const paths = [
    `${storagePath}/thumb.jpg`,
    `${storagePath}/display.jpg`,
    `${storagePath}/print.jpg`,
  ];
  await supabase.storage.from("trip-photos").remove(paths);

  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
}
