import { useMemo } from "react";
import { StyleSheet } from "react-native";
import RNMapView, { Marker } from "react-native-maps";
import { MAP_STYLE } from "../../theme/mapStyle";

interface MapPin {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

interface Props {
  pins: MapPin[];
}

export default function MapWrapper({ pins }: Props) {
  const region = useMemo(() => {
    if (pins.length === 0) return undefined;
    const lats = pins.map((p) => p.lat);
    const lngs = pins.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.02) * 1.5,
      longitudeDelta: Math.max(maxLng - minLng, 0.02) * 1.5,
    };
  }, [pins]);

  if (!region) return null;

  return (
    <RNMapView style={styles.map} initialRegion={region} customMapStyle={MAP_STYLE}>
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          coordinate={{ latitude: pin.lat, longitude: pin.lng }}
          title={pin.title}
          description={pin.subtitle}
        />
      ))}
    </RNMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
