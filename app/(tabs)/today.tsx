import { useMemo } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { useTrips, useTrip } from "../../features/trips/hooks";
import { useSession } from "../../lib/use-session";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import type { Trip } from "../../types/database";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function isTripActiveToday(trip: Trip, today: string): boolean {
  if (!trip.start_date || !trip.end_date) return false;
  return trip.start_date <= today && today <= trip.end_date;
}

export default function TodayScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { data: trips = [] } = useTrips(session?.user.id);
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

  if (!tripDetail || !todayDay) {
    return (
      <Container style={styles.container}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Feather name="sun" size={28} color={colors.gold} />
          </View>
          <Text variant="display" style={styles.emptyTitle}>today</Text>
          <Text variant="titleItalic" style={styles.emptySubtitle}>
            no plans for today
          </Text>
          <Text variant="caption" style={styles.emptyHint}>
            your itinerary will appear here{"\n"}when a trip day matches today's date
          </Text>
        </View>
      </Container>
    );
  }

  const items = [...todayDay.trip_items].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.sort_order - b.sort_order;
  });

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text variant="display" style={styles.title}>today</Text>
        <Text variant="eyebrow" style={styles.subtitle}>
          day {String(todayDay.day_number).padStart(2, "0")} · {tripDetail.title}
        </Text>

        {items.length === 0 ? (
          <View style={styles.noItems}>
            <Text variant="titleItalic" style={styles.noItemsText}>
              a free day — enjoy the spontaneity
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(`/trip/${tripDetail.id}/day/${todayDay.day_number}`)
                }
              >
                <View style={styles.itemRow}>
                  {item.time ? (
                    <Text variant="caption" style={styles.time}>{item.time}</Text>
                  ) : (
                    <View style={styles.timePlaceholder} />
                  )}
                  <View style={styles.dot} />
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
          <View style={styles.notesCard}>
            <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
            <Text variant="body" style={styles.notesText}>{todayDay.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 60 }} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  emptyWrap: {
    alignItems: "center",
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.stone,
  },
  emptyHint: {
    color: colors.taupe,
    textAlign: "center",
    lineHeight: 20,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  noItems: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  noItemsText: {
    color: colors.stone,
  },
  timeline: {
    gap: 4,
  },
  itemCard: {
    backgroundColor: colors.pearl,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
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
    backgroundColor: colors.taupe,
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
    backgroundColor: colors.pearl,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: spacing.md,
  },
  notesLabel: {
    marginBottom: spacing.sm,
  },
  notesText: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    color: colors.ink,
  },
});
