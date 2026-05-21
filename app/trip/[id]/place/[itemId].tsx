import { useState, useMemo, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../../features/design-system";
import { useTrip, useDeleteItem } from "../../../../features/trips/hooks";
import { getCategoryForItem } from "../../../../theme/categories";
import { colors } from "../../../../theme/colors";
import { spacing } from "../../../../theme/spacing";
import type { TripItem } from "../../../../types/database";

const SCREEN_W = Dimensions.get("window").width;
const GMAP_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";

/** Fetch a photo URL for a place name via Google Places API (New) */
async function fetchPlacePhoto(placeName: string): Promise<string | null> {
  if (!GMAP_KEY || !placeName) return null;
  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GMAP_KEY,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({ textQuery: placeName, maxResultCount: 1 }),
      }
    );
    const json = await res.json();
    const photoName = json.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return null;
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&key=${GMAP_KEY}`;
  } catch {
    return null;
  }
}

interface PlaceMeta {
  whySaved: string;
  source: string;
  hours: string;
  admission: string;
  howToGet: string;
  timeNeeded: string;
  bestFor: string;
  savedBy: string[];
}

function storageKey(itemId: string) {
  return `place_meta_${itemId}`;
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

export default function PlaceDetailScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [meta, setMeta] = useState<PlaceMeta>({
    whySaved: "",
    source: "",
    hours: "",
    admission: "",
    howToGet: "",
    timeNeeded: "",
    bestFor: "",
    savedBy: ["self"],
  });
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteItem = useDeleteItem(id ?? "");

  // Find the item across all days
  const { item, day } = useMemo(() => {
    if (!trip) return { item: null, day: null };
    for (const d of trip.trip_days) {
      const found = d.trip_items.find((i) => i.id === itemId);
      if (found) return { item: found, day: d };
    }
    return { item: null, day: null };
  }, [trip, itemId]);

  const cat = item ? getCategoryForItem(item.category) : null;

  // Fetch place photo from Google Places
  useEffect(() => {
    const name = item?.location_name || item?.title;
    if (name) {
      fetchPlacePhoto(name).then((url) => {
        if (url) setPhotoUrl(url);
      });
    }
  }, [item?.location_name, item?.title]);

  // Load persisted metadata
  useState(() => {
    AsyncStorage.getItem(storageKey(itemId)).then((raw) => {
      if (raw) setMeta(JSON.parse(raw));
      setLoaded(true);
    });
  });

  const persistMeta = useCallback(
    (next: PlaceMeta) => {
      setMeta(next);
      AsyncStorage.setItem(storageKey(itemId), JSON.stringify(next));
    },
    [itemId]
  );

  function toggleSaved() {
    setSaved(!saved);
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteItem.mutate(itemId, {
      onSuccess: () => router.back(),
    });
  }

  const quickFacts = [
    { key: "hours", label: "hours", value: meta.hours },
    { key: "admission", label: "admission", value: meta.admission },
    { key: "how to get", label: "how to get", value: meta.howToGet },
    { key: "time needed", label: "time needed", value: meta.timeNeeded },
    { key: "best for", label: "best for", value: meta.bestFor },
  ].filter((f) => editing || f.value);

  if (!trip || !item) return null;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero section with photo or category color */}
        <View style={[styles.hero, { backgroundColor: cat?.color ?? colors.gold }]}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
          ) : null}
          <View style={styles.heroOverlay}>
            {/* Top navigation */}
            <View style={styles.heroNav}>
              <TouchableOpacity
                style={styles.heroNavBtn}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Feather name="chevron-left" size={16} color={colors.ink} />
              </TouchableOpacity>
              <View style={styles.heroNavRight}>
                <TouchableOpacity
                  style={styles.heroNavBtn}
                  onPress={toggleSaved}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="heart"
                    size={16}
                    color={saved ? colors.coral : colors.stone}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category pill + saved by — bottom row */}
            <View style={styles.heroBottomRow}>
              <View style={styles.categoryPill}>
                <Feather name={cat?.icon ?? "map-pin"} size={10} color={colors.pearl} />
                <Text variant="caption" style={styles.categoryText}>
                  {cat?.label ?? "place"}
                </Text>
              </View>

              <View style={styles.savedByPill}>
                <View style={styles.avatarPair}>
                  <View style={[styles.miniAv, { backgroundColor: colors.coral }]}>
                    <Text style={styles.miniAvText}>P</Text>
                  </View>
                  {meta.savedBy.includes("partner") && (
                    <View
                      style={[
                        styles.miniAv,
                        { backgroundColor: colors.teal, marginLeft: -6 },
                      ]}
                    >
                      <Text style={styles.miniAvText}>L</Text>
                    </View>
                  )}
                </View>
                <Text variant="caption" style={styles.savedByText}>
                  {meta.savedBy.includes("partner")
                    ? "saved by both"
                    : "saved by you"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          {item.category && (
            <Text variant="eyebrow" style={styles.categoryLabel}>
              {cat?.label} {item.location_name ? `· ${item.location_name}` : ""}
            </Text>
          )}
          <Text variant="display" style={styles.placeTitle}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text variant="caption" style={styles.placeSubtitle}>
              {item.subtitle}
            </Text>
          )}
          {item.time && (
            <Text variant="caption" style={styles.timeText}>
              {formatTime12h(item.time)}
              {day?.date
                ? ` · day ${String(day.day_number).padStart(2, "0")}`
                : ""}
            </Text>
          )}
        </View>

        {/* Why we saved it */}
        <View style={styles.whySavedCard}>
          <Text variant="eyebrow" style={styles.whySavedLabel}>
            why we saved it
          </Text>
          {editing ? (
            <TextInput
              style={styles.whySavedInput}
              placeholder="what drew you to this place..."
              placeholderTextColor={colors.sand}
              value={meta.whySaved}
              onChangeText={(t) => setMeta({ ...meta, whySaved: t })}
              multiline
            />
          ) : meta.whySaved ? (
            <Text style={styles.whySavedText}>"{meta.whySaved}"</Text>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
              <Text style={styles.whySavedPlaceholder}>
                tap to add why you saved this place
              </Text>
            </TouchableOpacity>
          )}
          {meta.source && !editing ? (
            <Text variant="caption" style={styles.whySavedSource}>
              — {meta.source}
            </Text>
          ) : null}
        </View>

        {/* Quick facts */}
        <View style={styles.factsSection}>
          {quickFacts.length > 0 || editing ? (
            <>
              {(editing
                ? [
                    { key: "hours", label: "hours", value: meta.hours },
                    { key: "admission", label: "admission", value: meta.admission },
                    { key: "how to get", label: "how to get", value: meta.howToGet },
                    { key: "time needed", label: "time needed", value: meta.timeNeeded },
                    { key: "best for", label: "best for", value: meta.bestFor },
                  ]
                : quickFacts
              ).map((fact) => (
                <View key={fact.key} style={styles.factRow}>
                  <Text variant="eyebrow" style={styles.factLabel}>
                    {fact.label}
                  </Text>
                  {editing ? (
                    <TextInput
                      style={styles.factInput}
                      placeholder={`add ${fact.label}...`}
                      placeholderTextColor={colors.sand}
                      value={fact.value}
                      onChangeText={(t) =>
                        setMeta({
                          ...meta,
                          [fact.key === "how to get"
                            ? "howToGet"
                            : fact.key === "time needed"
                            ? "timeNeeded"
                            : fact.key === "best for"
                            ? "bestFor"
                            : fact.key]: t,
                        })
                      }
                    />
                  ) : (
                    <Text variant="body" style={styles.factValue}>
                      {fact.value}
                    </Text>
                  )}
                </View>
              ))}
            </>
          ) : (
            <TouchableOpacity
              style={styles.addFactsBtn}
              onPress={() => setEditing(true)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={12} color={colors.stone} />
              <Text variant="caption" style={styles.addFactsText}>
                add details like hours, admission, tips
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes from the item */}
        {item.notes && (
          <View style={styles.notesSection}>
            <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {editing ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              persistMeta(meta);
              setEditing(false);
            }}
            activeOpacity={0.85}
          >
            <Text variant="body" style={styles.primaryBtnText}>save details</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.coralBtn}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Feather name="check" size={14} color={colors.pearl} />
                <Text variant="body" style={styles.coralBtnText}>
                  on day {String(day?.day_number ?? 1).padStart(2, "0")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => setEditing(true)}
                activeOpacity={0.85}
              >
                <Text variant="body" style={styles.ghostBtnText}>edit details</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.deleteLink}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={12} color="#C44" />
              <Text variant="caption" style={styles.deleteLinkText}>
                {confirmDelete ? "tap again to confirm delete" : "delete this plan"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  /* Hero */
  hero: {
    height: SCREEN_W * 0.65,
    position: "relative",
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: 56,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  heroNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(247,242,226,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroNavRight: {
    flexDirection: "row",
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(30,42,58,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryText: {
    color: colors.pearl,
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedByPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(247,242,226,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  /* Title block */
  titleBlock: {
    padding: spacing.lg,
    paddingTop: 22,
    paddingBottom: 6,
  },
  categoryLabel: {
    marginBottom: 6,
  },
  placeTitle: {
    fontSize: 26,
    lineHeight: 28,
  },
  placeSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    marginTop: 8,
  },

  /* Saved by */
  avatarPair: {
    flexDirection: "row",
  },
  miniAv: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.pearl,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvText: {
    color: colors.pearl,
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },
  savedByText: {
    fontSize: 10,
    color: colors.ink,
    fontFamily: "Inter_500Medium",
  },

  /* Why we saved it */
  whySavedCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: 20,
  },
  whySavedLabel: {
    color: colors.coral,
    marginBottom: 10,
  },
  whySavedText: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 19,
    lineHeight: 28,
    color: colors.ink,
  },
  whySavedPlaceholder: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
    color: colors.sand,
    lineHeight: 26,
  },
  whySavedInput: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
    minHeight: 60,
    textAlignVertical: "top",
  },
  whySavedSource: {
    fontSize: 10,
    marginTop: 10,
  },

  /* Quick facts */
  factsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  factRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mist,
    gap: 14,
  },
  factLabel: {
    width: 80,
    fontSize: 9,
    paddingTop: 3,
  },
  factValue: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  factInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.ink,
    paddingVertical: 0,
  },
  addFactsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.md,
  },
  addFactsText: {
    color: colors.stone,
  },

  /* Notes */
  notesSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  notesLabel: {
    marginBottom: spacing.sm,
  },
  notesText: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },

  /* Bottom bar */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 28,
    backgroundColor: colors.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mist,
  },
  primaryBtn: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.pearl,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
  },
  coralBtn: {
    flex: 1,
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  coralBtnText: {
    color: colors.pearl,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  ghostBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    color: colors.stone,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  deleteLinkText: {
    color: "#C44",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
