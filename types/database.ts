export interface User {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "paid";
  subscription_status: "active" | "cancelled" | "expired";
  subscription_period_end: string | null;
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
  category: string | null;
  notes: string | null;
  link: string | null;
  photo_uri: string | null;
  assigned_to: string[];   // member IDs tagged on this activity
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
  location_lat?: number;
  location_lng?: number;
  category?: string;
  notes?: string;
  link?: string;
  photo_uri?: string;
}

export interface UpdateItemInput {
  title?: string;
  subtitle?: string | null;
  time?: string | null;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  category?: string | null;
  notes?: string | null;
  link?: string | null;
  photo_uri?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Trip Members / Sharing                                              */
/* ------------------------------------------------------------------ */

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

export type MemberRole = "owner" | "editor" | "viewer";

export interface TripInvite {
  id: string;
  trip_id: string;
  inviter_id: string;
  invitee_email: string | null;
  invitee_name: string | null;
  invite_code: string;
  status: InviteStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  display_name: string;
  avatar_color: string;
  email: string | null;
  role: MemberRole;
  joined_at: string;
}
