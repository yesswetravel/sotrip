export interface Photo {
  id: string;
  trip_id: string;
  trip_day_id: string | null;
  trip_item_id: string | null;
  owner_id: string;
  storage_path: string;
  thumbnail_url: string;
  display_url: string;
  print_url: string | null;
  caption: string | null;
  taken_at: string | null;
  sort_order: number;
  created_at: string;
}

export type PhotoUploadStatus =
  | "queued"
  | "processing"
  | "uploading"
  | "done"
  | "error";

export interface PhotoUploadJob {
  localUri: string;
  status: PhotoUploadStatus;
  progress: number;
  error?: string;
  photo?: Photo;
}
