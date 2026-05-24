import { useMemo, useState, useEffect, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import MapWrapper from "../../../features/shared/MapWrapper";
import type { MapPin } from "../../../features/shared/MapWrapper";
import ItemDetailSheet from "../../../features/trips/components/ItemDetailSheet";
import ItemSheet from "../../../features/trips/components/ItemSheet";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

export default function TripMapScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  // Detail / edit state
  const [selectedItem, setSelectedItem] = useState<TripItem | null>(null);
  const [editingItem, setEditingItem] = useState<TripItem | null>(null);
  const [editDayId, setEditDayId] = useState<string>("");

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

        // Watch for movement
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
          (loc) => {
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
        );
      } catch {
        setLocationError(true);
      }
    })();

    return () => {
      sub?.remove();
    };
  }, []);

  // Build pins from trip items — include photo_uri for hero photos
  const { pins, itemMap } = useMemo(() => {
    if (!trip) return { pins: [] as MapPin[], itemMap: new Map<string, { item: TripItem; dayId: string }>() };
    const result: MapPin[] = [];
    const map = new Map<string, { item: TripItem; dayId: string }>();

    for (const day of trip.trip_days) {
      for (const item of day.trip_items) {
        if (item.location_lat && item.location_lng) {
          result.push({
            id: item.id,
            title: item.title,
            subtitle: `day ${String(day.day_number).padStart(2, "0")}${item.time ? ` · ${formatTime(item.time)}` : ""}`,
            lat: item.location_lat,
            lng: item.location_lng,
            photoUri: item.photo_uri,
            category: item.category,
            dayLabel: `day ${day.day_number}`,
          });
          map.set(item.id, { item, dayId: day.id });
        }
      }
    }
    return { pins: result, itemMap: map };
  }, [trip]);

  // Handle pin press → show item detail
  const handlePinPress = useCallback((pin: MapPin) => {
    const entry = itemMap.get(pin.id);
    if (entry) {
      setSelectedItem(entry.item);
      setEditDayId(entry.dayId);
    }
  }, [itemMap]);

  // Handle edit from detail sheet
  function handleEdit() {
    if (selectedItem) {
      const entry = itemMap.get(selectedItem.id);
      setEditingItem(selectedItem);
      setEditDayId(entry?.dayId ?? "");
      setSelectedItem(null);
    }
  }

  return (
    <Container safe={false} logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">{trip?.title ?? ""} · map</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Map or empty */}
      {pins.length > 0 || userLocation ? (
        <View style={styles.mapContainer}>
          <MapWrapper
            pins={pins}
            onPinPress={handlePinPress}
            userLocation={userLocation}
          />

          {/* Legend overlay */}
          <View style={[styles.legend, { backgroundColor: colors.pearl + "E8" }]}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.coral }]} />
              <Text variant="caption" style={[styles.legendText, { color: colors.stone }]}>
                {pins.length} plan{pins.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {userLocation && (
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.teal }]} />
                <Text variant="caption" style={[styles.legendText, { color: colors.stone }]}>
                  you
                </Text>
              </View>
            )}
          </View>
        </View>
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

      {/* Item detail modal */}
      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEdit={handleEdit}
        />
      )}

      {/* Item edit sheet */}
      {editingItem && (
        <ItemSheet
          tripId={id}
          dayId={editDayId}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onDeleted={() => setEditingItem(null)}
        />
      )}
    </Container>
  );
}

function formatTime(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr}${suffix}`;
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
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
  /* Legend */
  legend: {
    position: "absolute",
    bottom: 16,
    left: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
});
