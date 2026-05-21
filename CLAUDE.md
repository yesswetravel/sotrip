@AGENTS.md

# SoTrip

Luxury travel planning and memory app for couples. Plan trips day-by-day, capture photos, build memory books, and share itineraries.

## Tech Stack

- **Runtime**: Expo 54 + React Native 0.81.5 + React 19 + TypeScript 5.9
- **Routing**: Expo Router 6 (file-based, `app/` directory)
- **Backend**: Supabase (auth via email OTP, Postgres database, storage)
- **Server state**: TanStack React Query 5
- **Client state**: Zustand 5 (subscription store only — manual AsyncStorage, NOT zustand/middleware persist)
- **UI**: React Native StyleSheet, @gorhom/bottom-sheet, react-native-maps, Feather icons
- **Fonts**: Cormorant Garamond (serif headings) + Inter (body text)

## Commands

```bash
npx expo start          # dev server (default port 8081)
npx expo start --web    # web preview
npx tsc --noEmit        # type check (no test suite yet)
```

## Environment

`.env` is gitignored. It must contain:
```
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase anon key>
EXPO_PUBLIC_GOOGLE_PLACES_KEY=<google places api key>
```
When using worktrees, copy `.env` manually — it won't be there by default.

## Architecture

### Auth Flow (app/_layout.tsx)
```
No session       → /(auth)/sign-in
Session + !seen  → /(auth)/paywall   (shown once per account)
Session + seen   → /(tabs)/          (main app)
```
The AuthGate in `_layout.tsx` reads `hasSeenPaywall` from the Zustand subscription store.

### Root Layout Provider Stack
```
GestureHandlerRootView → QueryClientProvider → ToastProvider → AuthGate (Slot)
```

### Tab Structure (app/(tabs)/_layout.tsx)
| Tab | File | Icon |
|-----|------|------|
| trips | index.tsx | map |
| today | today.tsx | sun |
| photos | photos.tsx | camera |
| me | you-two.tsx | user |
| (hidden) | profile.tsx | — |

### Feature Modules (features/)
```
features/
  design-system/    Text, Card, Container, Avatar
  shared/           Toast, CalendarStrip, LocationPicker, TimePicker, CategoryPicker, Skeleton, MapWrapper
  subscription/     constants, store (Zustand), hooks, UpgradeModal
  trips/            api (Supabase CRUD), hooks (React Query), ItemSheet, ItemDetailSheet
  photos/           api, hooks, pipeline, PhotoGrid, UploadProgressBanner
  couple/           hooks (useTripMembers — local invite/member management)
```

### Trip Route Tree (app/trip/[id]/)
```
index.tsx              trip overview
day/[n].tsx            day itinerary
day-look/[n].tsx       day visual preview
add-place.tsx          add activity
map.tsx, calendar.tsx, budget.tsx, documents.tsx, notes.tsx
outfits.tsx, packing.tsx, invite.tsx, settings.tsx
memory.tsx → memory-wizard.tsx → memory-confirmation.tsx → memory-order.tsx → memory-tracking.tsx
photo/[photoId].tsx    photo detail
place/[itemId].tsx     activity detail
```

## Database Schema (types/database.ts)

Core tables and their key columns:

- **User**: id, username, display_name, avatar_url, subscription_tier, subscription_status, subscription_period_end
- **Trip**: id, owner_id, title, destination, start_date, end_date, cover_photo_url, is_archived
- **TripDay**: id, trip_id, day_number, date, title, notes
- **TripItem**: id, trip_day_id, sort_order, title, subtitle, time, location_name, location_lat, location_lng, category, notes, link, photo_uri, assigned_to[]
- **TripMember**: id, trip_id, user_id, display_name, avatar_color, email, role (owner|editor|viewer)
- **TripInvite**: id, trip_id, inviter_id, invitee_email, invite_code, status (pending|accepted|declined|expired)
- **Photo**: id, trip_id, trip_day_id, trip_item_id, owner_id, storage_path, thumbnail_url, display_url, caption, taken_at

## Subscription System (features/subscription/)

### Tiers
| Feature | Free | Paid ($1.99/mo) |
|---------|------|-----------------|
| Active trips | 1 | Unlimited |
| Items per trip | 10 | Unlimited |
| Companions | 2 | Unlimited |
| Photos per day | 5 | Unlimited |
| Past trips visible | 1 | All |
| Memory book, AI, offline, PDF | No | Yes |

### Store (Zustand + manual AsyncStorage)
```
useSubscriptionStore: tier, status, hasSeenPaywall, setTier(), markPaywallSeen(), hydrate(userId), reset()
```
**IMPORTANT**: Do NOT use `zustand/middleware` persist — it causes Metro bundler errors ("Requiring unknown module"). Use manual `AsyncStorage.setItem/getItem` like `store.ts` does.

### Hooks
- `useSubscription()` — returns `{ tier, isPaid }`
- `useCanCreateTrip(currentCount)` — returns `{ canCreate }`
- `useCanAddItem(currentCount)` — returns `{ canAdd }`
- `useVisiblePastTrips(trips[])` — filters by tier limit

### Limit Enforcement
Limits are checked at two layers:
1. **UI layer**: before navigation/action (shows UpgradeModal)
2. **Save layer**: before Supabase insert (shows toast, defense-in-depth)

### Dev Toggle
Profile screen: tap "SoTrip v1.0.0" text 5 times to switch between free/paid tiers.

## Design System

### Colors (theme/colors.ts)
```
ivory   #ECE6D6   canvas/background
ink     #1E2A3A   primary text
coral   #D87560   primary accent, self avatar
teal    #4A6E6B   secondary accent, partner avatar
sand    #D6C6A2   disabled/past states
stone   #7C8290   muted text, captions
mist    #DED7C5   dividers, subtle borders
pearl   #F7F2E2   card surface
gold    #B8956A   photo placeholder tint
taupe   #A89E8B   decorative accents
```

### Typography (theme/typography.ts)
| Variant | Font | Size | Use |
|---------|------|------|-----|
| display | Cormorant Italic 500 | 28 | Screen titles |
| title | Cormorant 500 | 22 | Section headings |
| titleItalic | Cormorant Italic 500 | 22 | Decorative headings |
| subtitle | Cormorant Italic 500 | 18 | Subheadings |
| eyebrow | Inter 500 | 10 | Labels (uppercase, letter-spacing 2) |
| body | Inter 500 | 14 | Body text |
| caption | Inter 400 | 12 | Metadata, secondary text |

### Spacing (theme/spacing.ts)
```
xs: 4  sm: 8  md: 16  lg: 22  xl: 32  xxl: 48
```

### Components
- `<Text variant="display|title|body|caption|...">` — polymorphic text
- `<Container>` — SafeAreaView with ivory bg + horizontal padding
- `<Card>` — pearl bg card with rounded corners
- `<Avatar>` / `<AvatarPair>` — colored initials for self/partner

## Key Patterns

### Supabase Client (lib/supabase.ts)
Single client using AsyncStorage for session persistence, auto-refresh tokens, no URL detection.

### Session Hook (lib/use-session.ts)
Returns `{ session, loading }`. Hydrates subscription store on auth state change, resets on sign-out.

### React Query
- Trip hooks in `features/trips/hooks.ts`: useTrips, useTrip, useCreateTrip, useUpdateTrip, useDeleteTrip, useCreateItem, useUpdateItem, useDeleteItem, useReorderItems
- Photo hooks in `features/photos/hooks.ts`
- Optimistic updates with rollback

### Bottom Sheets
Uses @gorhom/bottom-sheet v5. ItemSheet is the main add/edit activity form.

### Trip Creation
`createTrip()` in `features/trips/api.ts` auto-generates TripDay rows for each date in the range.

### Maps
`MapWrapper.tsx` with a `.web.tsx` fallback (maps don't work on web).

### Categories (theme/categories.ts)
Activity types: dining, sightseeing, hotel, transport, shopping, nightlife, wellness, nature, culture, beach, adventure, coffee, photo-spot. Each has a Feather icon and color.

## Code Style

- All lowercase UI text (buttons say "sign in" not "Sign In")
- `StyleSheet.create()` at bottom of every screen file
- No inline styles except dynamic values
- Import colors/spacing/typography directly from theme (no prop drilling)
- Feather icons from `@expo/vector-icons`
- `activeOpacity={0.85}` on primary buttons, `0.8` on secondary
- `StyleSheet.hairlineWidth` for subtle borders
- Brand name via `APP_NAME` constant from `theme/brand.ts`
