export interface User {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  owner_id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_photo_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string | null;
  title: string | null;
  notes: string | null;
}

export interface TripItem {
  id: string;
  trip_day_id: string;
  sort_order: number;
  title: string;
  subtitle: string | null;
  time: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  created_at: string;
}

export interface TripWithDays extends Trip {
  trip_days: TripDay[];
}

export interface TripDayWithItems extends TripDay {
  trip_items: TripItem[];
}

export interface TripWithDaysAndItems extends Trip {
  trip_days: TripDayWithItems[];
}

export interface CreateTripInput {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
}

export interface CreateItemInput {
  trip_day_id: string;
  title: string;
  subtitle?: string;
  time?: string;
  location_name?: string;
  notes?: string;
}

export interface UpdateItemInput {
  title?: string;
  subtitle?: string | null;
  time?: string | null;
  location_name?: string | null;
  notes?: string | null;
}
