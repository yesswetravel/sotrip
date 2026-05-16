import { useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Container, Text, Card } from "../../../features/design-system";
import { CalendarStrip, Skeleton } from "../../../features/shared";
import { useTrip } from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "—";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "completed";
  if (diff === 0) return "today";
  return String(diff);
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(start + "T00:00:00").toLocaleDateString("en-US", opts).toLowerCase();
  const e = new Date(end + "T00:00:00").toLocaleDateString("en-US", opts).toLowerCase();
  return `${s} — ${e}`;
}

export default function TripOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading } = useTrip(id);

  const totalItems = useMemo(
    () => trip?.trip_days.reduce((sum, d) => sum + d.trip_items.length, 0) ?? 0,
    [trip]
  );

  const upcomingItems = useMemo(() => {
    if (!trip) return [];
    const items: (TripItem & { date: string; dayNumber: number })[] = [];
    const today = new Date().toISOString().split("T")[0];
    for (const day of trip.trip_days) {
      if (day.date && day.date >= today) {
        for (const item of day.trip_items) {
          items.push({ ...item, date: day.date, dayNumber: day.day_number });
        }
      }
    }
    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
    });
    return items.slice(0, 3);
  }, [trip]);

  const calendarDays = useMemo(
    () =>
      trip?.trip_days.map((d) => ({
        dayNumber: d.day_number,
        date: d.date ?? "",
      })) ?? [],
    [trip]
  );

  if (isLoading || !trip) {
    return (
      <Container>
        <Skeleton width="100%" height={200} borderRadius={0} />
        <View style={styles.statsRow}>
          <Skeleton width={100} height={60} />
          <Skeleton width={100} height={60} />
          <Skeleton width={100} height={60} />
        </View>
      </Container>
    );
  }

  return (
    <Container safe={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroPlaceholder} />
          <View style={styles.heroOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text variant="body" style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View style={styles.heroText}>
              <Text variant="display" style={styles.heroTitle}>{trip.title}</Text>
              <Text variant="eyebrow" style={styles.heroDates}>
                {formatDateRange(trip.start_date, trip.end_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="days" value={String(trip.trip_days.length)} />
          <StatCard label="places" value={String(totalItems)} />
          <StatCard label="days until" value={daysUntil(trip.start_date)} />
        </View>

        {/* Calendar strip */}
        <View style={styles.section}>
          <CalendarStrip
            days={calendarDays}
            selectedDay={0}
            onSelectDay={(n) => router.push(`/trip/${id}/day/${n}`)}
            todayDate={new Date().toISOString().split("T")[0]}
          />
        </View>

        {/* Upcoming items */}
        {upcomingItems.length > 0 && (
          <View style={styles.section}>
            <Text variant="eyebrow" style={styles.sectionLabel}>coming up</Text>
            {upcomingItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/trip/${id}/day/${item.dayNumber}`)}
              >
                <Card style={styles.previewCard}>
                  <View style={styles.previewRow}>
                    {item.time && (
                      <Text variant="caption" style={styles.previewTime}>{item.time}</Text>
                    )}
                    <View style={styles.previewContent}>
                      <Text variant="body" numberOfLines={1}>{item.title}</Text>
                      {item.location_name && (
                        <Text variant="eyebrow">{item.location_name}</Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text variant="title" style={styles.statValue}>{value}</Text>
      <Text variant="eyebrow">{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 220,
    position: "relative",
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.taupe,
    opacity: 0.25,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: 56,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 18,
    lineHeight: 20,
  },
  heroText: {
    gap: 4,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 28,
  },
  heroDates: {
    color: colors.stone,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginTop: -20,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  previewCard: {
    marginHorizontal: spacing.lg,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  previewTime: {
    width: 44,
  },
  previewContent: {
    flex: 1,
    gap: 2,
  },
});
