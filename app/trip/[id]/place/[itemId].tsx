import { useState, useMemo, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../../features/design-system";
import ItemSheet from "../../../../features/trips/components/ItemSheet";
import { useTrip } from "../../../../features/trips/hooks";
import { getCategoryForItem } from "../../../../theme/categories";
import { useColors } from "../../../../features/theme/ThemeProvider";
import { spacing } from "../../../../theme/spacing";
import type { TripItem } from "../../../../types/database";

const SCREEN_W = Dimensions.get("window").width;
const GMAP_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";

interface LinkPreview {
  title: string;
  author: string;
  thumbnailUrl?: string;
  source: string;
}

async function scrapeOgImage(url: string): Promise<{ image?: string; title?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SoTrip/1.0)" },
    });
    if (!res.ok) return {};
    const html = await res.text();
    const imgMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
      || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
    return { image: imgMatch?.[1], title: titleMatch?.[1] };
  } catch {}
  return {};
}

/** Try multiple oEmbed/proxy services to get a link preview */
async function tryOembed(url: string): Promise<LinkPreview | null> {
  // 1. Try native oEmbed endpoints
  if (url.includes("instagram.com") || url.includes("instagr.am")) {
    try {
      const res = await fetch(
        `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`
      );
      if (res.ok) {
        const d = await res.json();
        if (d.thumbnail_url) {
          return {
            title: d.title || "instagram post",
            author: `@${d.author_name || "unknown"}`,
            thumbnailUrl: d.thumbnail_url,
            source: "instagram",
          };
        }
      }
    } catch {}
  }
  if (url.includes("pinterest.com") || url.includes("pin.it")) {
    try {
      const res = await fetch(
        `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const d = await res.json();
        return {
          title: d.title || "pinned place",
          author: d.author_name || "pinterest",
          thumbnailUrl: d.thumbnail_url,
          source: "pinterest",
        };
      }
    } catch {}
  }
  if (url.includes("tiktok.com")) {
    try {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const d = await res.json();
        return {
          title: d.title || "tiktok video",
          author: `@${d.author_name || "unknown"}`,
          thumbnailUrl: d.thumbnail_url,
          source: "tiktok",
        };
      }
    } catch {}
  }
  return null;
}

/** Free proxy oEmbed — works for Instagram, YouTube, etc. without auth */
async function tryNoembedProxy(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d.error) return null;
    const isIg = url.includes("instagram.com") || url.includes("instagr.am");
    const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    return {
      title: d.title || (isIg ? "instagram post" : domain),
      author: d.author_name ? `@${d.author_name}` : domain,
      thumbnailUrl: d.thumbnail_url || d.url,
      source: isIg ? "instagram" : domain.replace(/\.com$/, ""),
    };
  } catch {}
  return null;
}

/** Try Microlink as a last resort — extracts og:image from any URL */
async function tryMicrolink(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data;
    if (!d) return null;
    const isIg = url.includes("instagram.com") || url.includes("instagr.am");
    const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    return {
      title: d.title || (isIg ? "instagram post" : domain),
      author: d.publisher || domain,
      thumbnailUrl: d.image?.url || d.logo?.url,
      source: isIg ? "instagram" : domain.replace(/\.com$/, ""),
    };
  } catch {}
  return null;
}

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  if (!url.trim()) return null;

  // Try native oEmbed first
  const native = await tryOembed(url);
  if (native?.thumbnailUrl) return native;

  // Try noembed.com proxy (free, no auth)
  const proxy = await tryNoembedProxy(url);
  if (proxy?.thumbnailUrl) return proxy;

  // Try microlink (free tier)
  const micro = await tryMicrolink(url);
  if (micro?.thumbnailUrl) return micro;

  // Try scraping og:image directly
  const og = await scrapeOgImage(url);
  if (og.image) {
    const isIg = url.includes("instagram.com") || url.includes("instagr.am");
    const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    return {
      title: og.title || (isIg ? "instagram post" : domain),
      author: isIg ? "instagram" : domain,
      thumbnailUrl: og.image,
      source: isIg ? "instagram" : domain,
    };
  }

  return null;
}

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
  const colors = useColors();
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [meta, setMeta] = useState<PlaceMeta>({
    whySaved: "",
    source: "",
    savedBy: ["self"],
  });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const { item, day } = useMemo(() => {
    if (!trip) return { item: null, day: null };
    for (const d of trip.trip_days) {
      const found = d.trip_items.find((i) => i.id === itemId);
      if (found) return { item: found, day: d };
    }
    return { item: null, day: null };
  }, [trip, itemId]);

  const cat = item ? getCategoryForItem(item.category) : null;

  useEffect(() => {
    const name = item?.location_name || item?.title;
    // Hero photo always from Google Places only
    if (name) {
      fetchPlacePhoto(name).then((url) => {
        if (url) setPhotoUrl(url);
      });
    }
    // Link preview separately
    if (item?.link) {
      setLinkLoading(true);
      fetchLinkPreview(item.link).then((preview) => {
        setLinkPreview(preview);
        setLinkLoading(false);
      });
    }
  }, [item?.link, item?.location_name, item?.title]);

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

  if (!trip || !item) return null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.ivory }]}>
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

            <View style={styles.heroBottomRow}>
              <View style={styles.categoryPill}>
                <Feather name={cat?.icon ?? "map-pin"} size={10} color={colors.pearl} />
                <Text variant="caption" style={styles.categoryText}>
                  {cat?.label ?? "place"}
                </Text>
              </View>

              <View style={styles.savedByPill}>
                <View style={styles.avatarPair}>
                  <View style={[styles.miniAv, { backgroundColor: colors.coral, borderColor: colors.pearl }]}>
                    <Text style={[styles.miniAvText, { color: colors.pearl }]}>P</Text>
                  </View>
                  {meta.savedBy.includes("partner") && (
                    <View
                      style={[
                        styles.miniAv,
                        { backgroundColor: colors.teal, borderColor: colors.pearl, marginLeft: -6 },
                      ]}
                    >
                      <Text style={[styles.miniAvText, { color: colors.pearl }]}>L</Text>
                    </View>
                  )}
                </View>
                <Text variant="caption" style={[styles.savedByText, { color: colors.ink }]}>
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

        {/* Link preview card — shown when oEmbed succeeds */}
        {linkPreview ? (
          <TouchableOpacity
            style={[styles.linkCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
            onPress={() => item.link && Linking.openURL(item.link)}
            activeOpacity={0.8}
          >
            {linkPreview.thumbnailUrl ? (
              <Image
                source={{ uri: linkPreview.thumbnailUrl }}
                style={styles.linkThumb}
                contentFit="contain"
                transition={200}
              />
            ) : null}
            <View style={styles.linkInfo}>
              <View style={[styles.sourceBadge, {
                backgroundColor: linkPreview.source === "instagram" ? "#E1306C"
                  : linkPreview.source === "pinterest" ? "#E60023"
                  : linkPreview.source === "tiktok" ? "#010101"
                  : colors.stone,
              }]}>
                <Text style={styles.sourceBadgeText}>{linkPreview.source}</Text>
              </View>
              <Text variant="body" style={[styles.linkTitle, { color: colors.ink }]} numberOfLines={2}>
                {linkPreview.title}
              </Text>
              <Text variant="caption" style={{ color: colors.stone }}>
                {linkPreview.author}
              </Text>
            </View>
            <Feather name="external-link" size={14} color={colors.stone} style={{ marginRight: 14 }} />
          </TouchableOpacity>
        ) : null}

        {/* Fallback link row — when item has a link but oEmbed didn't produce a preview */}
        {item.link && !linkPreview && !linkLoading ? (
          <TouchableOpacity
            style={[styles.linkRow, { borderColor: colors.mist }]}
            onPress={() => Linking.openURL(item.link!)}
            activeOpacity={0.8}
          >
            <Feather name="link" size={13} color={colors.coral} />
            <Text variant="caption" style={[styles.linkRowText, { color: colors.ink }]} numberOfLines={1}>
              {item.link.replace(/^https?:\/\/(www\.)?/, "").split("?")[0]}
            </Text>
            <Feather name="external-link" size={12} color={colors.stone} />
          </TouchableOpacity>
        ) : null}

        {/* Why we saved it — always editable, auto-saves on blur */}
        <View style={[styles.whySavedCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <Text variant="eyebrow" style={[styles.whySavedLabel, { color: colors.coral }]}>
            why we saved it
          </Text>
          <TextInput
            style={[styles.whySavedInput, { color: colors.ink }]}
            placeholder="what drew you to this place..."
            placeholderTextColor={colors.sand}
            value={meta.whySaved}
            onChangeText={(t) => setMeta({ ...meta, whySaved: t })}
            onBlur={() => persistMeta({ ...meta })}
            multiline
          />
        </View>


        {/* Notes from the item */}
        {item.notes && (
          <View style={styles.notesSection}>
            <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
            <Text style={[styles.notesText, { color: colors.ink }]}>{item.notes}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.ivory, borderTopColor: colors.mist }]}>
        <TouchableOpacity
          style={[styles.editPlanBtn, { backgroundColor: colors.ink }]}
          onPress={() => setShowEditSheet(true)}
          activeOpacity={0.85}
        >
          <Feather name="edit-2" size={13} color={colors.pearl} style={{ marginRight: 6 }} />
          <Text variant="body" style={[styles.primaryBtnText, { color: colors.pearl }]}>edit plan</Text>
        </TouchableOpacity>
      </View>

      {showEditSheet && day && (
        <ItemSheet
          tripId={id}
          dayId={day.id}
          item={item}
          onClose={() => setShowEditSheet(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    color: "#F7F2E2",
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
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },
  savedByText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },

  /* Link preview */
  linkCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  linkThumb: {
    width: 80,
    height: 80,
    backgroundColor: "#f5f0e4",
  },
  linkInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  linkTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkLoading: {
    flex: 1,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  sourceBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  /* Why we saved it */
  whySavedCard: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  whySavedLabel: {
    marginBottom: 10,
  },
  whySavedInput: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
    lineHeight: 26,
    minHeight: 60,
    textAlignVertical: "top",
  },

  /* Link fallback row */
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkRowText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
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
  },

  /* Bottom bar */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  editPlanBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
