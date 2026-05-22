import { useMemo } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "../../../features/design-system";
import MapWrapper from "../../../features/shared/MapWrapper";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

export default function TripMapScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const pins = useMemo(() => {
    if (!trip) return [];
    const result: { id: string; title: string; subtitle: string; lat: number; lng: number }[] = [];
    for (const day of trip.trip_days) {
      for (const item of day.trip_items) {
        if (item.location_lat && item.location_lng) {
          result.push({
            id: item.id,
            title: item.title,
            subtitle: `day ${String(day.day_number).padStart(2, "0")}`,
            lat: item.location_lat,
            lng: item.location_lng,
          });
        }
      }
    }
    return result;
  }, [trip]);

  return (
    <View style={[styles.container, { backgroundColor: colors.ivory }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.ivory }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text variant="body" style={[styles.backText, { color: colors.stone }]}>← back</Text>
        </TouchableOpacity>
        <Text variant="eyebrow">{trip?.title ?? ""} · map</Text>
      </View>

      {/* Map or empty */}
      {pins.length > 0 ? (
        <MapWrapper pins={pins} />
      ) : (
        <View style={styles.empty}>
          <Text variant="titleItalic" style={{ color: colors.stone }}>
            no locations yet
          </Text>
          <Text variant="caption" style={[styles.emptyHint, { color: colors.taupe }]}>
            add locations to your itinerary items{"\n"}and they'll appear on the map
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backText: {
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyHint: {
    textAlign: "center",
    lineHeight: 20,
  },
});
