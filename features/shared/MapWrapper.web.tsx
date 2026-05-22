import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../design-system";
import { useColors } from "../theme/ThemeProvider";
import { MAP_STYLE } from "../../theme/mapStyle";

const GMAP_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";

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
  const colors = useColors();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!GMAP_KEY || pins.length === 0) return;

    // Load Google Maps script if not already loaded
    if (!(window as any).google?.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || !(window as any).google?.maps) return;

      const google = (window as any).google;

      // Calculate bounds
      const bounds = new google.maps.LatLngBounds();
      pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));

      const map = new google.maps.Map(mapRef.current, {
        center: bounds.getCenter(),
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: MAP_STYLE,
      });

      map.fitBounds(bounds, 60);
      mapInstanceRef.current = map;

      // Add markers
      pins.forEach((pin, i) => {
        const marker = new google.maps.Marker({
          position: { lat: pin.lat, lng: pin.lng },
          map,
          title: pin.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#D87560",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
          label: {
            text: String(i + 1),
            color: "#FFFFFF",
            fontSize: "9px",
            fontWeight: "600",
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 4px 2px;">
              <div style="font-size: 14px; font-weight: 600; color: #1E2A3A;">${pin.title}</div>
              <div style="font-size: 11px; color: #8A8578; margin-top: 2px;">${pin.subtitle}</div>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });
    }
  }, [pins]);

  if (!GMAP_KEY) {
    return (
      <View style={styles.empty}>
        <Text variant="titleItalic" style={[styles.emptyText, { color: colors.stone }]}>
          map requires API key
        </Text>
      </View>
    );
  }

  if (pins.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="titleItalic" style={[styles.emptyText, { color: colors.stone }]}>
          no locations yet
        </Text>
        <Text variant="caption" style={[styles.hint, { color: colors.taupe }]}>
          add locations to your plans and they'll appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {},
  hint: {},
});
