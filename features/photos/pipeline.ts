import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "../../lib/supabase";
import type { Photo, PhotoUploadJob } from "../../types/photos";

const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;

interface ResizeSpec {
  key: "thumb" | "display" | "print";
  maxSize: number;
  quality: number;
}

const SIZES: ResizeSpec[] = [
  { key: "thumb", maxSize: 300, quality: 0.75 },
  { key: "display", maxSize: 1080, quality: 0.85 },
  { key: "print", maxSize: 2400, quality: 0.9 },
];

type ProgressCallback = (jobs: PhotoUploadJob[]) => void;

export async function pickPhotos(): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("photo library access is needed to add photos");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    quality: 1,
    exif: true,
  });

  if (result.canceled) return [];
  return result.assets.map((a) => a.uri);
}

async function readExifDate(uri: string): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      exif: true,
    });
    if (result.canceled || !result.assets[0]?.exif) return null;
    const exif = result.assets[0].exif;
    const dateStr =
      (exif.DateTimeOriginal as string) ??
      (exif.DateTime as string) ??
      null;
    if (!dateStr) return null;
    const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
    return new Date(normalized).toISOString();
  } catch {
    return null;
  }
}

async function resizeAndStrip(
  uri: string,
  spec: ResizeSpec
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: spec.maxSize } }],
    {
      compress: spec.quality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}

async function uploadFile(
  localUri: string,
  storagePath: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("trip-photos")
    .upload(storagePath, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("trip-photos")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

async function uploadWithRetry(
  localUri: string,
  storagePath: string,
  retries = MAX_RETRIES
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadFile(localUri, storagePath);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("upload failed after retries");
}

async function processOnePhoto(
  uri: string,
  tripId: string,
  dayId: string | null,
  ownerId: string,
  job: PhotoUploadJob,
  onUpdate: () => void
): Promise<Photo> {
  const photoId = crypto.randomUUID();

  job.status = "processing";
  job.progress = 0.1;
  onUpdate();

  const takenAt = await readExifDate(uri).catch(() => null);

  const resized = await Promise.all(
    SIZES.map((spec) => resizeAndStrip(uri, spec))
  );

  job.status = "uploading";
  job.progress = 0.4;
  onUpdate();

  const basePath = `trips/${tripId}/${photoId}`;
  const [thumbUrl, displayUrl, printUrl] = await Promise.all([
    uploadWithRetry(resized[0], `${basePath}/thumb.jpg`),
    uploadWithRetry(resized[1], `${basePath}/display.jpg`),
    uploadWithRetry(resized[2], `${basePath}/print.jpg`),
  ]);

  job.progress = 0.85;
  onUpdate();

  const { data, error } = await supabase
    .from("photos")
    .insert({
      id: photoId,
      trip_id: tripId,
      trip_day_id: dayId,
      trip_item_id: null,
      owner_id: ownerId,
      storage_path: basePath,
      thumbnail_url: thumbUrl,
      display_url: displayUrl,
      print_url: printUrl,
      caption: null,
      taken_at: takenAt,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) throw error;

  job.status = "done";
  job.progress = 1;
  job.photo = data;
  onUpdate();

  return data;
}

export async function uploadPhotos(
  uris: string[],
  tripId: string,
  dayId: string | null,
  ownerId: string,
  onProgress: ProgressCallback
): Promise<Photo[]> {
  const jobs: PhotoUploadJob[] = uris.map((uri) => ({
    localUri: uri,
    status: "queued",
    progress: 0,
  }));

  onProgress([...jobs]);

  const results: Photo[] = [];
  let cursor = 0;

  async function runNext(): Promise<void> {
    const index = cursor++;
    if (index >= jobs.length) return;

    try {
      const photo = await processOnePhoto(
        jobs[index].localUri,
        tripId,
        dayId,
        ownerId,
        jobs[index],
        () => onProgress([...jobs])
      );
      results.push(photo);
    } catch (err) {
      jobs[index].status = "error";
      jobs[index].error =
        err instanceof Error ? err.message : "upload failed";
      onProgress([...jobs]);
    }

    await runNext();
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENT, uris.length) },
    () => runNext()
  );

  await Promise.all(workers);
  return results;
}
