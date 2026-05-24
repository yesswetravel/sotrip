import { useMemo, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { useTrips, useTrip, usePrefetchTrips } from "../../features/trips/hooks";
import { useSession } from "../../lib/use-session";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import type { Trip } from "../../types/database";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isTripActiveToday(trip: Trip, today: string): boolean {
  if (!trip.start_date || !trip.end_date) return false;
  return trip.start_date <= today && today <= trip.end_date;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts).toLowerCase()} — ${e.toLocaleDateString("en-US", opts).toLowerCase()}`;
}

function tripDuration(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getMoodLabel(days: number): string {
  if (days === 0) return "today!";
  if (days === 1) return "tomorrow!";
  if (days <= 3) return "so close!";
  if (days <= 7) return "almost there";
  if (days <= 14) return "two weeks away";
  if (days <= 30) return "coming soon";
  return "on the horizon";
}

function getMoodIcon(days: number): "sun" | "zap" | "star" | "compass" | "map" {
  if (days <= 1) return "sun";
  if (days <= 7) return "zap";
  if (days <= 30) return "star";
  return "compass";
}

const EXCITEMENT_MESSAGES: { max: number; messages: string[] }[] = [
  { max: 0, messages: ["you made it! soak in every moment", "the wait is over — go make memories"] },
  { max: 1, messages: ["is your bag packed?", "tomorrow's the day — sleep tight!", "one more sleep!"] },
  { max: 3, messages: ["can you feel it? so close!", "the countdown is real!", "are you excited? we are!"] },
  { max: 7, messages: ["the excitement is building!", "start picking outfits!", "time to make a playlist?"] },
  { max: 14, messages: ["two weeks of daydreaming ahead", "perfect time to plan your days", "the anticipation is half the fun"] },
  { max: 30, messages: ["good things are coming", "plenty of time to plan something special", "mark your calendar!"] },
  { max: Infinity, messages: ["something beautiful to look forward to", "let the planning begin"] },
];

function getExcitementMessage(days: number): string {
  const bucket = EXCITEMENT_MESSAGES.find((b) => days <= b.max)!;
  return bucket.messages[Math.floor(Math.random() * bucket.messages.length)];
}

/* ------------------------------------------------------------------ */
/*  Pulsing ring for trips < 7 days away                               */
/* ------------------------------------------------------------------ */

function PulseRing({ color, size }: { color: string; size: number }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Hero countdown card — next upcoming trip                           */
/* ------------------------------------------------------------------ */

function CountdownHero({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const colors = useColors();
  const days = daysUntil(trip.start_date!);
  const duration = tripDuration(trip.start_date, trip.end_date);
  const mood = getMoodLabel(days);
  const moodIcon = getMoodIcon(days);
  const isClose = days <= 7;
  const excitement = useMemo(() => getExcitementMessage(days), [days]);

  return (
    <TouchableOpacity
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.pearl,
          borderColor: colors.mist,
          shadowColor: colors.ink,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top accent bar */}
      <View style={[styles.heroAccent, { backgroundColor: colors.coral }]} />

      <View style={styles.heroContent}>
        {/* Countdown number */}
        <View style={styles.heroCountdownWrap}>
          {isClose && <PulseRing color={colors.coral} size={100} />}
          <Text style={[styles.heroNumber, { color: colors.coral }]}>{days}</Text>
        </View>

        <Text style={[styles.heroDaysText, { color: colors.stone }]}>
          {days === 1 ? "day to go" : "days to go"}
        </Text>

        {/* Decorative divider */}
        <View style={styles.heroDividerRow}>
          <View style={[styles.heroDividerLine, { backgroundColor: colors.mist }]} />
          <View style={[styles.heroDividerDot, { backgroundColor: colors.coral }]} />
          <View style={[styles.heroDividerLine, { backgroundColor: colors.mist }]} />
        </View>

        {/* Trip details */}
        <Text style={[styles.heroTripName, { color: colors.ink }]}>
          {trip.title.toLowerCase()}
        </Text>
        <Text variant="caption" style={[styles.heroDateRange, { color: colors.stone }]}>
          {formatDateRange(trip.start_date, trip.end_date)}
          {duration > 0 ? ` · ${duration} days` : ""}
        </Text>

        {/* Mood badge */}
        <View style={[styles.moodBadge, { backgroundColor: colors.coral + "10" }]}>
          <Feather name={moodIcon} size={12} color={colors.coral} />
          <Text style={[styles.moodText, { color: colors.coral }]}>{mood}</Text>
        </View>

        {/* Excitement message */}
        <Text style={[styles.excitementText, { color: colors.stone }]}>
          {excitement}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact countdown card — additional trips                          */
/* ------------------------------------------------------------------ */

function CountdownCompact({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const colors = useColors();
  const days = daysUntil(trip.start_date!);

  return (
    <TouchableOpacity
      style={[
        styles.compactCard,
        { backgroundColor: colors.pearl, borderColor: colors.mist },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.compactNumberWrap, { backgroundColor: colors.coral + "0A" }]}>
        <Text style={[styles.compactNumber, { color: colors.coral }]}>{days}</Text>
        <Text style={[styles.compactDaysLabel, { color: colors.stone }]}>
          {days === 1 ? "day" : "days"}
        </Text>
      </View>
      <View style={styles.compactBody}>
        <Text style={[styles.compactTripName, { color: colors.ink }]} numberOfLines={1}>
          {trip.title.toLowerCase()}
        </Text>
        <Text variant="caption" style={{ color: colors.stone }}>
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.taupe} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state — no upcoming trips                                    */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const colors = useColors();
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.gold + "14" }]}>
        <Feather name="sun" size={28} color={colors.gold} />
      </View>
      <Text variant="titleItalic" style={[styles.emptySubtitle, { color: colors.stone }]}>
        no upcoming trips
      </Text>
      <Text variant="caption" style={[styles.emptyHint, { color: colors.taupe }]}>
        create a trip and your countdown{"\n"}will appear here
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

export default function TodayScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session } = useSession();
  const { data: trips = [], isError, refetch } = useTrips(session?.user.id);
  usePrefetchTrips(trips);
  const today = getToday();

  const activeTrip = useMemo(
    () => trips.find((t) => isTripActiveToday(t, today)) ?? null,
    [trips, today]
  );

  const { data: tripDetail } = useTrip(activeTrip?.id);

  const todayDay = useMemo(() => {
    if (!tripDetail) return null;
    return tripDetail.trip_days.find((d) => d.date === today) ?? null;
  }, [tripDetail, today]);

  const upcomingTrips = useMemo(() => {
    return trips
      .filter((t) => t.start_date && t.start_date > today)
      .sort((a, b) => a.start_date!.localeCompare(b.start_date!));
  }, [trips, today]);

  function handleOpenTrip(tripId: string) {
    router.push(`/trip/${tripId}`);
  }

  /* ---------- Error state ---------- */
  if (isError) {
    return (
      <Container logo>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text variant="display" style={styles.title}>today</Text>
          <View style={styles.emptyWrap}>
            <Feather name="wifi-off" size={28} color={colors.stone} />
            <Text variant="titleItalic" style={[styles.emptySubtitle, { color: colors.stone }]}>
              couldn't load trips
            </Text>
            <TouchableOpacity
              style={{ marginTop: spacing.md, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.coral, borderRadius: 999 }}
              onPress={() => refetch()}
              activeOpacity={0.85}
            >
              <Text variant="body" style={{ color: colors.pearl, fontFamily: "InstrumentSans_500Medium", fontSize: 13 }}>try again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Container>
    );
  }

  /* ---------- Active trip today: show itinerary ---------- */

  if (tripDetail && todayDay) {
    const items = [...todayDay.trip_items].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.sort_order - b.sort_order;
    });

    return (
      <Container logo>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text variant="display" style={styles.title}>today</Text>
          <Text variant="eyebrow" style={styles.activeTripLabel}>
            day {String(todayDay.day_number).padStart(2, "0")} · {tripDetail.title}
          </Text>

          {items.length === 0 ? (
            <View style={styles.noItems}>
              <Text variant="titleItalic" style={[styles.noItemsText, { color: colors.stone }]}>
                a free day — enjoy the spontaneity
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/trip/${tripDetail.id}/day/${todayDay.day_number}`)}
                >
                  <View style={styles.itemRow}>
                    {item.time ? (
                      <Text variant="caption" style={styles.time}>{item.time}</Text>
                    ) : (
                      <View style={styles.timePlaceholder} />
                    )}
                    <View style={[styles.dot, { backgroundColor: colors.taupe }]} />
                    <View style={styles.itemBody}>
                      <Text variant="body" style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text variant="caption" numberOfLines={1}>{item.subtitle}</Text>
                      )}
                      {item.location_name && (
                        <Text variant="eyebrow" style={styles.location}>
                          {item.location_name}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {todayDay.notes ? (
            <View style={[styles.notesCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
              <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
              <Text variant="body" style={[styles.notesText, { color: colors.ink }]}>
                {todayDay.notes}
              </Text>
            </View>
          ) : null}

          {upcomingTrips.length > 0 && (
            <View style={styles.comingUpSection}>
              <Text variant="eyebrow" style={styles.comingUpLabel}>coming up</Text>
              {upcomingTrips.map((t) => (
                <CountdownCompact key={t.id} trip={t} onPress={() => handleOpenTrip(t.id)} />
              ))}
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </Container>
    );
  }

  /* ---------- No active trip: show countdown cards ---------- */

  return (
    <Container logo>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text variant="display" style={styles.title}>today</Text>

        {upcomingTrips.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.countdownSection}>
            <CountdownHero
              trip={upcomingTrips[0]}
              onPress={() => handleOpenTrip(upcomingTrips[0].id)}
            />

            {upcomingTrips.length > 1 && (
              <View style={styles.otherTripsSection}>
                <Text variant="eyebrow" style={styles.otherTripsLabel}>also coming up</Text>
                {upcomingTrips.slice(1).map((t) => (
                  <CountdownCompact key={t.id} trip={t} onPress={() => handleOpenTrip(t.id)} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: "center",
  },

  /* ---- Hero countdown card ---- */
  heroCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroAccent: {
    height: 3,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: spacing.lg,
  },
  heroCountdownWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  heroNumber: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 72,
    lineHeight: 80,
  },
  heroDaysText: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    marginTop: 2,
  },
  heroDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
    width: "60%",
  },
  heroDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  heroDividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  heroTripName: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 24,
    lineHeight: 28,
    textAlign: "center",
  },
  heroDateRange: {
    marginTop: 4,
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 16,
  },
  moodText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  excitementText: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
  },

  /* ---- Compact countdown card ---- */
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 14,
  },
  compactNumberWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  compactNumber: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 24,
    lineHeight: 26,
  },
  compactDaysLabel: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  compactBody: {
    flex: 1,
    gap: 2,
  },
  compactTripName: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
  },

  /* ---- Countdown section layout ---- */
  countdownSection: {
    marginTop: spacing.xl,
    gap: spacing.xl,
  },
  otherTripsSection: {
    gap: 8,
  },
  otherTripsLabel: {
    marginBottom: spacing.xs,
  },

  /* ---- Coming up (below active itinerary) ---- */
  comingUpSection: {
    marginTop: spacing.xl,
    gap: 8,
  },
  comingUpLabel: {
    marginBottom: spacing.xs,
  },

  /* ---- Active trip itinerary (preserved) ---- */
  activeTripLabel: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  noItems: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  noItemsText: {},
  timeline: {
    gap: 4,
  },
  itemCard: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  time: {
    width: 44,
    paddingTop: 2,
  },
  timePlaceholder: {
    width: 44,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 16,
  },
  location: {
    marginTop: 4,
  },
  notesCard: {
    marginTop: spacing.lg,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  notesLabel: {
    marginBottom: spacing.sm,
  },
  notesText: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
  },

  /* ---- Empty state ---- */
  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing.xxl * 2,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptySubtitle: {},
  emptyHint: {
    textAlign: "center",
    lineHeight: 20,
  },
});
