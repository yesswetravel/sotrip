import { useEffect, useRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../design-system";
import { useColors } from "../theme/ThemeProvider";
import { MAP_STYLE } from "../../theme/mapStyle";

const GMAP_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";

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
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const onPinPressRef = useRef(onPinPress);
  onPinPressRef.current = onPinPress;

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
      if (userLocation) {
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      }

      const map = new google.maps.Map(mapRef.current, {
        center: bounds.getCenter(),
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: MAP_STYLE,
      });

      map.fitBounds(bounds, 60);
      mapInstanceRef.current = map;

      // Add pin markers
      pins.forEach((pin, i) => {
        let markerContent: HTMLElement;

        if (pin.photoUri) {
          // Photo marker
          markerContent = document.createElement("div");
          markerContent.style.cssText = `
            display: flex; flex-direction: column; align-items: center; cursor: pointer;
          `;
          const photoCircle = document.createElement("div");
          photoCircle.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            border: 2.5px solid #D87560; overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          `;
          const img = document.createElement("img");
          img.src = pin.photoUri;
          img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
          img.onerror = () => {
            photoCircle.innerHTML = `<div style="width:100%;height:100%;background:#D87560;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;">${i + 1}</div>`;
          };
          photoCircle.appendChild(img);
          markerContent.appendChild(photoCircle);

          const arrow = document.createElement("div");
          arrow.style.cssText = `
            width: 0; height: 0;
            border-left: 5px solid transparent; border-right: 5px solid transparent;
            border-top: 6px solid #D87560; margin-top: -1px;
          `;
          markerContent.appendChild(arrow);
        } else {
          // Numbered dot marker
          markerContent = document.createElement("div");
          markerContent.style.cssText = `
            display: flex; flex-direction: column; align-items: center; cursor: pointer;
          `;
          const dot = document.createElement("div");
          dot.style.cssText = `
            width: 28px; height: 28px; border-radius: 50%;
            background: #D87560; border: 2.5px solid #fff;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: 11px; font-weight: 700;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          `;
          dot.textContent = String(i + 1);
          markerContent.appendChild(dot);

          const arrow = document.createElement("div");
          arrow.style.cssText = `
            width: 0; height: 0;
            border-left: 5px solid transparent; border-right: 5px solid transparent;
            border-top: 6px solid #D87560; margin-top: -1px;
          `;
          markerContent.appendChild(arrow);
        }

        // Use AdvancedMarkerElement if available, else fall back to regular Marker
        if (google.maps.marker?.AdvancedMarkerElement) {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            content: markerContent,
            title: pin.title,
          });
          marker.addListener("click", () => {
            onPinPressRef.current?.(pin);
          });
        } else {
          // Fallback: use classic Marker
          const marker = new google.maps.Marker({
            position: { lat: pin.lat, lng: pin.lng },
            map,
            title: pin.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#D87560",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2.5,
            },
            label: {
              text: String(i + 1),
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: "700",
            },
          });

          // Direct click → open detail
          marker.addListener("click", () => {
            onPinPressRef.current?.(pin);
          });
        }
      });

      // User location marker
      if (userLocation) {
        addUserLocationMarker(map, google, userLocation);
      }
    }

    function addUserLocationMarker(map: any, google: any, loc: { lat: number; lng: number }) {
      // Create pulsing user dot
      const userDot = document.createElement("div");
      userDot.style.cssText = `
        width: 22px; height: 22px; border-radius: 50%;
        background: rgba(74, 110, 107, 0.2);
        display: flex; align-items: center; justify-content: center;
      `;
      const innerDot = document.createElement("div");
      innerDot.style.cssText = `
        width: 12px; height: 12px; border-radius: 50%;
        background: #4A6E6B; border: 2px solid #fff;
        box-shadow: 0 0 6px rgba(74, 110, 107, 0.4);
      `;
      userDot.appendChild(innerDot);

      if (google.maps.marker?.AdvancedMarkerElement) {
        userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: loc.lat, lng: loc.lng },
          map,
          content: userDot,
          title: "you are here",
        });
      } else {
        userMarkerRef.current = new google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map,
          title: "you are here",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#4A6E6B",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        });
      }
    }
  }, [pins, userLocation]);

  if (!GMAP_KEY) {
    return (
      <View style={styles.empty}>
        <Text variant="titleItalic" style={[styles.emptyText, { color: colors.stone }]}>
          map requires API key
        </Text>
      </View>
    );
  }

  if (pins.length === 0 && !userLocation) {
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
