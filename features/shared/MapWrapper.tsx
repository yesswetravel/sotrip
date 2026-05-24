import { useMemo } from "react";
import { StyleSheet, View, Image } from "react-native";
import RNMapView, { Marker, Callout } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { Text } from "../design-system";
import { MAP_STYLE } from "../../theme/mapStyle";
import { useColors } from "../theme/ThemeProvider";

export interface MapPin {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  photoUri?: string | null;
  category?: string | null;
  dayLabel?: string;
}

interface Props {
  pins: MapPin[];
  onPinPress?: (pin: MapPin) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapWrapper({ pins, onPinPress, userLocation }: Props) {
  const colors = useColors();

  const region = useMemo(() => {
    if (pins.length === 0 && !userLocation) return undefined;
    const allLats = pins.map((p) => p.lat);
    const allLngs = pins.map((p) => p.lng);
    if (userLocation) {
      allLats.push(userLocation.lat);
      allLngs.push(userLocation.lng);
    }
    if (allLats.length === 0) return undefined;
    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.02) * 1.5,
      longitudeDelta: Math.max(maxLng - minLng, 0.02) * 1.5,
    };
  }, [pins, userLocation]);

  if (!region) return null;

  return (
    <RNMapView
      style={styles.map}
      initialRegion={region}
      customMapStyle={MAP_STYLE}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
    >
      {pins.map((pin, i) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.lat, longitude: pin.lng }}
          onPress={() => onPinPress?.(pin)}
        >
          {/* Custom pin marker */}
          <View style={styles.pinContainer}>
            {pin.photoUri ? (
              <View style={[styles.photoPin, { borderColor: colors.coral }]}>
                <Image source={{ uri: pin.photoUri }} style={styles.photoPinImage} />
              </View>
            ) : (
              <View style={[styles.dotPin, { backgroundColor: colors.coral, borderColor: "#fff" }]}>
                <Text variant="caption" style={styles.dotPinNumber}>{i + 1}</Text>
              </View>
            )}
            <View style={[styles.pinArrow, { borderTopColor: pin.photoUri ? colors.coral : colors.coral }]} />
          </View>

          <Callout tooltip onPress={() => onPinPress?.(pin)}>
            <View style={[styles.callout, { backgroundColor: colors.pearl, shadowColor: colors.ink }]}>
              {pin.photoUri && (
                <Image source={{ uri: pin.photoUri }} style={styles.calloutPhoto} />
              )}
              <View style={styles.calloutBody}>
                <Text variant="body" numberOfLines={1} style={[styles.calloutTitle, { color: colors.ink }]}>
                  {pin.title}
                </Text>
                <Text variant="caption" style={[styles.calloutSub, { color: colors.taupe }]}>
                  {pin.subtitle}
                </Text>
              </View>
              <View style={styles.calloutChevron}>
                <Feather name="chevron-right" size={14} color={colors.taupe} />
              </View>
            </View>
          </Callout>
        </Marker>
      ))}

      {/* User location marker (fallback if showsUserLocation doesn't render) */}
      {userLocation && (
        <Marker
          coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userDotOuter}>
            <View style={[styles.userDot, { backgroundColor: colors.teal }]} />
          </View>
        </Marker>
      )}
    </RNMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  /* Custom pin */
  pinContainer: {
    alignItems: "center",
  },
  photoPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    overflow: "hidden",
  },
  photoPinImage: {
    width: "100%",
    height: "100%",
  },
  dotPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPinNumber: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
  /* Callout */
  callout: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 8,
    minWidth: 180,
    maxWidth: 260,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutPhoto: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
  },
  calloutBody: {
    flex: 1,
    gap: 2,
  },
  calloutTitle: {
    fontWeight: "600",
    fontSize: 13,
  },
  calloutSub: {
    fontSize: 11,
  },
  calloutChevron: {
    marginLeft: 6,
  },
  /* User location dot */
  userDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(74, 110, 107, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
