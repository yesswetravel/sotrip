import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPhotosByDay, fetchPhotosByTrip, updatePhoto, deletePhoto } from "./api";
import type { Photo } from "../../types/photos";

export function usePhotosByDay(dayId: string | undefined) {
  return useQuery({
    queryKey: ["photos", "day", dayId],
    queryFn: () => fetchPhotosByDay(dayId!),
    enabled: !!dayId,
  });
}

export function usePhotosByTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ["photos", "trip", tripId],
    queryFn: () => fetchPhotosByTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useUpdatePhoto(dayId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      photoId,
      patch,
    }: {
      photoId: string;
      patch: Partial<Pick<Photo, "caption" | "trip_day_id" | "trip_item_id" | "sort_order">>;
    }) => updatePhoto(photoId, patch),
    onSuccess: () => {
      if (dayId) qc.invalidateQueries({ queryKey: ["photos", "day", dayId] });
      qc.invalidateQueries({ queryKey: ["photos", "trip"] });
    },
  });
}

export function useDeletePhoto(dayId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, storagePath }: { photoId: string; storagePath: string }) =>
      deletePhoto(photoId, storagePath),
    onSuccess: () => {
      if (dayId) qc.invalidateQueries({ queryKey: ["photos", "day", dayId] });
      qc.invalidateQueries({ queryKey: ["photos", "trip"] });
    },
  });
}
