import { useMemo } from "react";
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
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import type { Trip } from "../../types/database";

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const dates = formatDateRange(trip.start_date, trip.end_date);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardPhoto}>
        {trip.cover_photo_url ? null : <View style={styles.placeholder} />}
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
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name="map" size={28} color={colors.coral} />
      </View>
      <Text variant="titleItalic" style={styles.emptyTitle}>
        no trips yet
      </Text>
      <Text variant="caption" style={styles.emptyCaption}>
        plan your first adventure — add places{"\n"}from pinterest, google, or just your imagination
      </Text>
      <TouchableOpacity style={styles.newButton} onPress={onNew} activeOpacity={0.85}>
        <Text variant="body" style={styles.newButtonText}>+ create a trip</Text>
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
  const { session } = useSession();
  const router = useRouter();
  const { data: trips, isLoading, refetch, isRefetching } = useTrips(session?.user.id);

  const firstName = session?.user.user_metadata?.display_name?.split(" ")[0]
    ?? session?.user.email?.split("@")[0]
    ?? "traveller";

  const { upcoming, past } = useMemo(() => {
    if (!trips) return { upcoming: [], past: [] };
    const today = new Date().toISOString().split("T")[0];
    return {
      upcoming: trips.filter((t) => !t.end_date || t.end_date >= today),
      past: trips.filter((t) => t.end_date && t.end_date < today),
    };
  }, [trips]);

  function handleNew() {
    router.push("/trip/new");
  }

  function handleOpen(tripId: string) {
    router.push(`/trip/${tripId}`);
  }

  if (isLoading) {
    return (
      <Container>
        <Text variant="display" style={styles.greeting}>bonjour, {firstName}</Text>
        <LoadingSkeleton />
      </Container>
    );
  }

  const hasTrips = upcoming.length > 0 || past.length > 0;

  return (
    <Container>
      <Text variant="display" style={styles.greeting}>bonjour, {firstName}</Text>

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
        <TouchableOpacity style={styles.fab} onPress={handleNew} activeOpacity={0.85}>
          <Text variant="body" style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: colors.coral + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.stone,
  },
  emptyCaption: {
    color: colors.taupe,
    textAlign: "center",
    lineHeight: 20,
  },
  newButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  newButtonText: {
    color: colors.pearl,
    fontFamily: "Inter_500Medium",
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
    backgroundColor: colors.pearl,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: colors.ink,
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
    backgroundColor: colors.taupe,
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
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: colors.ivory,
    fontSize: 24,
    lineHeight: 26,
  },
});
