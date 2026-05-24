import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { Skeleton } from "../../features/shared";
import { useTrips } from "../../features/trips/hooks";
import { useSession } from "../../lib/use-session";
import {
  useSubscription,
  useCanCreateTrip,
  useVisiblePastTrips,
} from "../../features/subscription/hooks";
import UpgradeModal from "../../features/subscription/UpgradeModal";
import { TIER_LIMITS } from "../../features/subscription/constants";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import type { Trip } from "../../types/database";

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const colors = useColors();
  const dates = formatDateRange(trip.start_date, trip.end_date);
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.pearl, borderColor: colors.mist, shadowColor: colors.ink }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardPhoto}>
        {trip.cover_photo_url ? null : <View style={[styles.placeholder, { backgroundColor: colors.taupe }]} />}
      </View>
      <View style={styles.cardBody}>
        <Text variant="title" numberOfLines={1}>{trip.title}</Text>
        {dates ? <Text variant="caption">{dates}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString("en-US", opts).toLowerCase();
  const endStr = e.toLocaleDateString("en-US", opts).toLowerCase();
  return `${startStr} — ${endStr}`;
}

function EmptyState({ onNew }: { onNew: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.coral + "14" }]}>
        <Feather name="map" size={28} color={colors.coral} />
      </View>
      <Text variant="titleItalic" style={[styles.emptyTitle, { color: colors.stone }]}>
        no trips yet
      </Text>
      <Text variant="caption" style={[styles.emptyCaption, { color: colors.taupe }]}>
        plan your first adventure — add places{"\n"}from pinterest, google, or just your imagination
      </Text>
      <TouchableOpacity style={[styles.newButton, { backgroundColor: colors.coral }]} onPress={onNew} activeOpacity={0.85}>
        <Text variant="body" style={[styles.newButtonText, { color: colors.pearl }]}>+ create a trip</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletons}>
      <Skeleton width="100%" height={140} borderRadius={8} />
      <Skeleton width="100%" height={140} borderRadius={8} />
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const { session } = useSession();
  const router = useRouter();
  const { data: trips, isLoading, refetch, isRefetching } = useTrips(session?.user.id);
  const { tier, isPaid } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const firstName = session?.user.user_metadata?.display_name?.split(" ")[0]
    ?? session?.user.email?.split("@")[0]
    ?? "traveller";

  const { upcoming, past: allPast } = useMemo(() => {
    if (!trips) return { upcoming: [], past: [] };
    const today = new Date().toISOString().split("T")[0];
    return {
      upcoming: trips.filter((t) => !t.end_date || t.end_date >= today),
      past: trips.filter((t) => t.end_date && t.end_date < today),
    };
  }, [trips]);

  const past = useVisiblePastTrips(allPast);
  const { canCreate, limit } = useCanCreateTrip(upcoming.length);

  function handleNew() {
    if (!canCreate) {
      setShowUpgrade(true);
      return;
    }
    router.push("/trip/new");
  }

  function handleOpen(tripId: string) {
    router.push(`/trip/${tripId}`);
  }

  if (isLoading) {
    return (
      <Container logo>
        <Text variant="display" style={styles.greeting}>Hey, {firstName}</Text>
        <LoadingSkeleton />
      </Container>
    );
  }

  const hasTrips = upcoming.length > 0 || past.length > 0;

  return (
    <Container logo>
      <Text variant="display" style={styles.greeting}>Hey, {firstName}</Text>

      {!hasTrips ? (
        <EmptyState onNew={handleNew} />
      ) : (
        <FlatList
          data={[
            ...(upcoming.length > 0 ? [{ type: "header" as const, label: "upcoming" }] : []),
            ...upcoming.map((t) => ({ type: "trip" as const, trip: t })),
            ...(past.length > 0 ? [{ type: "header" as const, label: "past" }] : []),
            ...past.map((t) => ({ type: "trip" as const, trip: t })),
          ]}
          keyExtractor={(item, i) =>
            item.type === "header" ? `header-${item.label}` : item.trip.id
          }
          renderItem={({ item }) => {
            if (item.type === "header") {
              return <Text variant="eyebrow" style={styles.sectionHeader}>{item.label}</Text>;
            }
            return (
              <TripCard
                trip={item.trip}
                onPress={() => handleOpen(item.trip.id)}
              />
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.taupe}
            />
          }
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      {hasTrips && (
        <View style={styles.fabArea}>
          {!isPaid && (
            <View style={[styles.tierBadge, { backgroundColor: colors.mist }]}>
              <Text variant="caption" style={[styles.tierBadgeText, { color: colors.stone }]}>
                free · {upcoming.length}/{limit} trip{limit === 1 ? "" : "s"}
              </Text>
            </View>
          )}
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.ink, shadowColor: colors.ink }]} onPress={handleNew} activeOpacity={0.85}>
            <Text variant="body" style={[styles.fabText, { color: colors.ivory }]}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <UpgradeModal
        visible={showUpgrade}
        limitMessage={`the free plan allows ${limit} active trip. upgrade to plan unlimited adventures.`}
        onClose={() => setShowUpgrade(false)}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {},
  emptyCaption: {
    textAlign: "center",
    lineHeight: 20,
  },
  newButton: {
    marginTop: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  newButtonText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPhoto: {
    height: 80,
  },
  placeholder: {
    flex: 1,
    opacity: 0.2,
  },
  cardBody: {
    padding: spacing.md,
    gap: 4,
  },
  skeletons: {
    gap: 12,
    marginTop: spacing.md,
  },
  fabArea: {
    position: "absolute",
    right: 24,
    bottom: 24,
    alignItems: "center",
    gap: 8,
  },
  tierBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierBadgeText: {
    fontSize: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    fontSize: 24,
    lineHeight: 26,
  },
});
