import { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../design-system";
import { useColors } from "../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";

interface Prediction {
  place_id: string;
  name: string;
  address: string;
}

interface PlaceDetail {
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  photo_uri?: string;
}

interface Props {
  value: string;
  onSelect: (place: PlaceDetail) => void;
  onClear: () => void;
  placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Google Places (New) via fetch — works on native & web              */
/* ------------------------------------------------------------------ */

async function searchPlaces(input: string): Promise<Prediction[]> {
  if (!PLACES_API_KEY || input.length < 2) return [];

  try {
    // Use the Places API (New) — Text Search with CORS support
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.photos",
        },
        body: JSON.stringify({
          textQuery: input,
          maxResultCount: 5,
        }),
      }
    );
    const json = await res.json();

    if (!json.places) return [];

    return json.places.map((p: any) => {
      // Build photo URL from first photo reference
      let photo_uri: string | undefined;
      if (p.photos?.[0]?.name) {
        photo_uri = `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=800&maxWidthPx=1200&key=${PLACES_API_KEY}`;
      }
      return {
        place_id: p.id,
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? "",
        lat: p.location?.latitude ?? 0,
        lng: p.location?.longitude ?? 0,
        photo_uri,
      };
    });
  } catch (err) {
    console.warn("Places search error:", err);
    return [];
  }
}

async function getPlaceDetail(prediction: Prediction & { lat?: number; lng?: number }): Promise<PlaceDetail> {
  return {
    name: prediction.name,
    formatted_address: prediction.address,
    lat: (prediction as any).lat ?? 0,
    lng: (prediction as any).lng ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function LocationPicker({
  value,
  onSelect,
  onClear,
  placeholder = "search a place...",
}: Props) {
  const colors = useColors();
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<(Prediction & { lat: number; lng: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function handleChangeText(text: string) {
    setQuery(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setPredictions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(text.trim());
    }, 300);
  }

  async function fetchResults(input: string) {
    setLoading(true);
    try {
      const results = await searchPlaces(input);
      setPredictions(results as any);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(prediction: Prediction & { lat: number; lng: number; photo_uri?: string }) {
    Keyboard.dismiss();
    setPredictions([]);
    setQuery(prediction.name);
    setFocused(false);
    onSelect({
      name: prediction.name,
      formatted_address: prediction.address,
      lat: prediction.lat,
      lng: prediction.lng,
      photo_uri: prediction.photo_uri,
    });
  }

  function handleClear() {
    setQuery("");
    setPredictions([]);
    onClear();
  }

  // No API key — plain text input fallback
  if (!PLACES_API_KEY) {
    return (
      <View style={styles.container}>
        <View style={[styles.inputRow, { backgroundColor: colors.pearl, borderColor: colors.sand }]}>
          <Feather name="search" size={14} color={colors.stone} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, styles.inputFlex, { color: colors.ink }]}
            placeholder={placeholder}
            placeholderTextColor={colors.stone}
            value={query}
            onChangeText={setQuery}
            onBlur={() => {
              if (query.trim()) {
                onSelect({ name: query.trim(), formatted_address: "", lat: 0, lng: 0 });
              }
            }}
            returnKeyType="done"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { backgroundColor: colors.pearl, borderColor: colors.sand }]}>
        <Feather name="search" size={14} color={colors.stone} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, styles.inputFlex, { color: colors.ink }]}
          placeholder={placeholder}
          placeholderTextColor={colors.stone}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator size="small" color={colors.stone} style={styles.trailingIcon} />
        )}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.trailingIcon}>
            <Feather name="x" size={14} color={colors.stone} />
          </TouchableOpacity>
        )}
      </View>

      {predictions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          {predictions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={[styles.row, { borderBottomColor: colors.mist }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Feather name="map-pin" size={14} color={colors.taupe} style={styles.rowIcon} />
              <View style={styles.rowText}>
                <Text variant="body" numberOfLines={1} style={[styles.mainText, { color: colors.ink }]}>
                  {item.name}
                </Text>
                <Text variant="caption" numberOfLines={1} style={[styles.secondaryText, { color: colors.stone }]}>
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchIcon: {
    paddingLeft: spacing.md,
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  inputFlex: {
    flex: 1,
  },
  trailingIcon: {
    paddingRight: spacing.md,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
    zIndex: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 12,
  },
});
