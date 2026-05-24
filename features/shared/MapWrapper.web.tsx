import { useEffect, useRef, useState } from "react";
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

/* ------------------------------------------------------------------ */
/*  Custom overlay for rich HTML markers (photos, dots, user location) */
/* ------------------------------------------------------------------ */

function createOverlayClass(google: any) {
  class CustomOverlay extends google.maps.OverlayView {
    private position: any;
    private div: HTMLDivElement | null = null;
    private content: HTMLElement;
    private anchorY: string; // "bottom" for pins, "center" for user dot

    constructor(
      position: any,
      content: HTMLElement,
      map: any,
      anchor: "bottom" | "center" = "bottom",
    ) {
      super();
      this.position = position;
      this.content = content;
      this.anchorY = anchor;
      this.setMap(map);
    }

    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.cursor = "pointer";
      this.div.appendChild(this.content);
      const panes = this.getPanes();
      panes.overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      const projection = this.getProjection();
      if (!projection || !this.div) return;
      const pos = projection.fromLatLngToDivPixel(this.position);
      if (!pos) return;
      if (this.anchorY === "bottom") {
        this.div.style.left = `${pos.x}px`;
        this.div.style.top = `${pos.y}px`;
        this.div.style.transform = "translate(-50%, -100%)";
      } else {
        this.div.style.left = `${pos.x}px`;
        this.div.style.top = `${pos.y}px`;
        this.div.style.transform = "translate(-50%, -50%)";
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    }

    updatePosition(lat: number, lng: number) {
      this.position = new google.maps.LatLng(lat, lng);
      this.draw();
    }
  }

  return CustomOverlay;
}

/* ------------------------------------------------------------------ */
/*  Build marker HTML elements                                         */
/* ------------------------------------------------------------------ */

function buildPinElement(pin: MapPin, index: number): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "display:flex;flex-direction:column;align-items:center;cursor:pointer;";

  if (pin.photoUri) {
    // Photo circle marker
    const circle = document.createElement("div");
    circle.style.cssText = `
      width:42px;height:42px;border-radius:50%;
      border:3px solid #D87560;overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
      background:#D87560;
    `;
    const img = document.createElement("img");
    img.src = pin.photoUri;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    img.onerror = () => {
      circle.innerHTML = `<div style="width:100%;height:100%;background:#D87560;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;">${index + 1}</div>`;
    };
    circle.appendChild(img);
    wrapper.appendChild(circle);
  } else {
    // Numbered dot marker
    const dot = document.createElement("div");
    dot.style.cssText = `
      width:30px;height:30px;border-radius:50%;
      background:#D87560;border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:12px;font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
    `;
    dot.textContent = String(index + 1);
    wrapper.appendChild(dot);
  }

  // Arrow
  const arrow = document.createElement("div");
  arrow.style.cssText = `
    width:0;height:0;
    border-left:5px solid transparent;border-right:5px solid transparent;
    border-top:7px solid #D87560;margin-top:-1px;
  `;
  wrapper.appendChild(arrow);

  return wrapper;
}

function buildUserDotElement(): HTMLElement {
  const outer = document.createElement("div");
  outer.style.cssText = `
    width:24px;height:24px;border-radius:50%;
    background:rgba(74,110,107,0.25);
    display:flex;align-items:center;justify-content:center;
    animation:userPulse 2s ease-in-out infinite;
  `;
  const inner = document.createElement("div");
  inner.style.cssText = `
    width:14px;height:14px;border-radius:50%;
    background:#4A6E6B;border:2.5px solid #fff;
    box-shadow:0 0 8px rgba(74,110,107,0.5);
  `;
  outer.appendChild(inner);

  // Add pulse animation keyframes if not already added
  if (!document.getElementById("sotrip-map-pulse-css")) {
    const style = document.createElement("style");
    style.id = "sotrip-map-pulse-css";
    style.textContent = `
      @keyframes userPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
  }

  return outer;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function MapWrapper({ pins, onPinPress, userLocation }: Props) {
  const colors = useColors();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);
  const onPinPressRef = useRef(onPinPress);
  onPinPressRef.current = onPinPress;

  // Browser geolocation fallback when expo-location doesn't provide a location
  const [browserLocation, setBrowserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (userLocation || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBrowserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        /* permission denied or unavailable — that's fine */
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setBrowserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userLocation]);

  const effectiveUserLoc = userLocation ?? browserLocation;

  useEffect(() => {
    if (!GMAP_KEY || (pins.length === 0 && !effectiveUserLoc)) return;

    // Load Google Maps script
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
      const CustomOverlay = createOverlayClass(google);

      // Remove old overlays
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      if (userOverlayRef.current) {
        userOverlayRef.current.setMap(null);
        userOverlayRef.current = null;
      }

      // Calculate bounds
      const bounds = new google.maps.LatLngBounds();
      pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      if (effectiveUserLoc) {
        bounds.extend({ lat: effectiveUserLoc.lat, lng: effectiveUserLoc.lng });
      }

      // Create or reuse map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: pins.length > 0 ? bounds.getCenter() : { lat: 0, lng: 0 },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          styles: MAP_STYLE,
        });
      }

      const map = mapInstanceRef.current;

      if (pins.length > 0 || effectiveUserLoc) {
        map.fitBounds(bounds, 60);
      }

      // Add pin overlays
      pins.forEach((pin, i) => {
        const el = buildPinElement(pin, i);
        el.addEventListener("click", () => {
          onPinPressRef.current?.(pin);
        });

        const overlay = new CustomOverlay(
          new google.maps.LatLng(pin.lat, pin.lng),
          el,
          map,
          "bottom",
        );
        overlaysRef.current.push(overlay);
      });

      // User location overlay
      if (effectiveUserLoc) {
        const userEl = buildUserDotElement();
        userOverlayRef.current = new CustomOverlay(
          new google.maps.LatLng(effectiveUserLoc.lat, effectiveUserLoc.lng),
          userEl,
          map,
          "center",
        );
      }
    }

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      if (userOverlayRef.current) {
        userOverlayRef.current.setMap(null);
        userOverlayRef.current = null;
      }
    };
  }, [pins, effectiveUserLoc]);

  if (!GMAP_KEY) {
    return (
      <View style={styles.empty}>
        <Text
          variant="titleItalic"
          style={[styles.emptyText, { color: colors.stone }]}
        >
          map requires API key
        </Text>
      </View>
    );
  }

  if (pins.length === 0 && !effectiveUserLoc) {
    return (
      <View style={styles.empty}>
        <Text
          variant="titleItalic"
          style={[styles.emptyText, { color: colors.stone }]}
        >
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
