import { useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { useSession } from "../../lib/use-session";
import { useTrips } from "../../features/trips/hooks";
import { usePhotosByTrip } from "../../features/photos/hooks";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import type { Photo } from "../../types/photos";
import type { Trip } from "../../types/database";

const GRID_GAP = 2;
const NUM_COLUMNS = 3;

function PhotoTile({ photo, size }: { photo: Photo; size: number }) {
  return (
    <Image
      source={{ uri: photo.thumbnail_url }}
      style={{ width: size, height: size, borderRadius: 2 }}
      contentFit="cover"
      transition={200}
    />
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Feather name="camera" size={28} color={colors.gold} />
      </View>
      <Text variant="titleItalic" style={styles.emptyTitle}>
        capture the moments
      </Text>
      <Text variant="caption" style={styles.emptyCaption}>
        photos from your trips will appear here
      </Text>
    </View>
  );
}

/** Each trip gets its own component so usePhotosByTrip is called at top level */
function TripPhotoSection({ trip, tileSize }: { trip: Trip; tileSize: number }) {
  const { data: photos = [] } = usePhotosByTrip(trip.id);

  const sorted = useMemo(
    () =>
      [...photos].sort(
        (a, b) =>
          new Date(b.taken_at ?? b.created_at).getTime() -
          new Date(a.taken_at ?? a.created_at).getTime()
      ),
    [photos]
  );

  if (sorted.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text variant="eyebrow" style={styles.sectionHeader}>
        {trip.title}
      </Text>
      <View style={styles.grid}>
        {sorted.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} size={tileSize} />
        ))}
      </View>
    </View>
  );
}

export default function PhotosScreen() {
  const { session } = useSession();
  const { data: trips, isLoading } = useTrips(session?.user.id);
  const { width: screenWidth } = useWindowDimensions();

  const tileSize =
    (screenWidth - spacing.lg * 2 - GRID_GAP * (NUM_COLUMNS - 1)) /
    NUM_COLUMNS;

  const tripList = trips ?? [];

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text variant="display" style={styles.title}>
          photos
        </Text>

        {isLoading || tripList.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.sectionList}>
            {tripList.map((trip) => (
              <TripPhotoSection key={trip.id} trip={trip} tileSize={tileSize} />
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: "center",
  },
  count: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  /* ---- empty state ---- */
  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing.xxl * 2,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.stone,
  },
  emptyCaption: {
    color: colors.taupe,
    textAlign: "center",
    lineHeight: 20,
  },
  /* ---- grid ---- */
  sectionList: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
});
