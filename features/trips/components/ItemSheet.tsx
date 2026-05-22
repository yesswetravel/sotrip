import { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "../../design-system";
import { LocationPicker, TimePicker, CategoryPicker } from "../../shared";
import { useToast } from "../../shared/toast-context";
import { useCreateItem, useUpdateItem, useDeleteItem } from "../hooks";
import { useCanAddItem } from "../../subscription/hooks";
import { useColors } from "../../theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

interface ItemSheetProps {
  tripId: string;
  dayId: string;
  item: TripItem | null;
  currentItemCount?: number;
  /** When provided, enables the outfit tab and auto-assigns outfits to this day */
  dayNumber?: number;
  onClose: () => void;
  /** Called when outfits change so the parent can refresh its display */
  onOutfitsChanged?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Outfit type & helpers                                               */
/* ------------------------------------------------------------------ */

interface Outfit {
  id: string;
  photoUri: string;
  name: string;
  notes: string;
  dayNumber: number | null;
  createdAt: string;
}

function outfitStorageKey(tripId: string) {
  return `outfits_${tripId}`;
}

const SCREEN_W = Dimensions.get("window").width;
const OUTFIT_TILE_GAP = 10;
const OUTFIT_TILE_W = (SCREEN_W - spacing.lg * 2 - OUTFIT_TILE_GAP * 2) / 3;

/* ------------------------------------------------------------------ */
/*  Link preview via oEmbed APIs                                        */
/* ------------------------------------------------------------------ */

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

async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  if (!url.trim()) return null;
  try {
    if (url.includes("instagram.com") || url.includes("instagr.am")) {
      const res = await fetch(
        `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`
      );
      if (res.ok) {
        const d = await res.json();
        if (d.thumbnail_url) {
          return { title: d.title || "instagram post", author: `@${d.author_name || "unknown"}`, thumbnailUrl: d.thumbnail_url, source: "instagram" };
        }
      }
      const og = await scrapeOgImage(url);
      if (og.image) {
        return { title: og.title || "instagram post", author: "instagram", thumbnailUrl: og.image, source: "instagram" };
      }
    }
    if (url.includes("pinterest.com") || url.includes("pin.it")) {
      const res = await fetch(
        `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const d = await res.json();
        return { title: d.title || "pinned place", author: d.author_name || "pinterest", thumbnailUrl: d.thumbnail_url, source: "pinterest" };
      }
    }
    if (url.includes("tiktok.com")) {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const d = await res.json();
        return { title: d.title || "tiktok video", author: `@${d.author_name || "unknown"}`, thumbnailUrl: d.thumbnail_url, source: "tiktok" };
      }
    }
    const og = await scrapeOgImage(url);
    if (og.image) {
      const domain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
      return { title: og.title || domain, author: domain, thumbnailUrl: og.image, source: domain };
    }
  } catch {}
  return null;
}

/* ------------------------------------------------------------------ */
/*  Field label                                                         */
/* ------------------------------------------------------------------ */

function FieldLabel({ label, icon }: { label: string; icon: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <View style={styles.fieldLabel}>
      <Feather name={icon} size={12} color={colors.taupe} />
      <Text style={[styles.fieldLabelText, { color: colors.taupe }]}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Outfit Tab Content                                                  */
/* ------------------------------------------------------------------ */

function OutfitTabContent({
  tripId,
  dayNumber,
  onOutfitsChanged,
}: {
  tripId: string;
  dayNumber: number;
  onOutfitsChanged?: () => void;
}) {
  const colors = useColors();
  const { show } = useToast();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadOutfits = useCallback(() => {
    AsyncStorage.getItem(outfitStorageKey(tripId)).then((raw) => {
      if (raw) setOutfits(JSON.parse(raw));
      setLoaded(true);
    });
  }, [tripId]);

  useEffect(() => { loadOutfits(); }, [loadOutfits]);

  const dayOutfits = outfits.filter((o) => o.dayNumber === dayNumber);

  function persist(next: Outfit[]) {
    setOutfits(next);
    AsyncStorage.setItem(outfitStorageKey(tripId), JSON.stringify(next));
    onOutfitsChanged?.();
  }

  async function handleAddOutfit() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 6,
      });
      if (result.canceled || result.assets.length === 0) return;

      const newOutfits = result.assets.map((asset, idx) => ({
        id: `${Date.now()}_${idx}`,
        photoUri: asset.uri,
        name: "",
        notes: "",
        dayNumber,
        createdAt: new Date().toISOString(),
      }));
      persist([...outfits, ...newOutfits]);
    } catch {
      show("couldn't add outfit");
    }
  }

  function handleDeleteOutfit(outfitId: string) {
    persist(outfits.filter((o) => o.id !== outfitId));
  }

  return (
    <View>
      {/* Outfit grid */}
      {dayOutfits.length > 0 && (
        <View style={styles.outfitGrid}>
          {dayOutfits.map((outfit) => (
            <View key={outfit.id} style={[styles.outfitTile, { borderColor: colors.mist }]}>
              <Image
                source={{ uri: outfit.photoUri }}
                style={styles.outfitImage}
                contentFit="cover"
                transition={200}
              />
              <TouchableOpacity
                style={[styles.outfitDeleteBtn, { backgroundColor: colors.pearl }]}
                onPress={() => handleDeleteOutfit(outfit.id)}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Feather name="x" size={10} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Empty state + add button */}
      {dayOutfits.length === 0 ? (
        <View style={styles.outfitEmpty}>
          <View style={[styles.outfitEmptyIcon, { backgroundColor: colors.coral + "14" }]}>
            <Feather name="scissors" size={22} color={colors.coral} />
          </View>
          <Text variant="titleItalic" style={{ color: colors.stone }}>
            no outfit yet
          </Text>
          <TouchableOpacity
            style={[styles.outfitAddBtn, { backgroundColor: colors.ink }]}
            onPress={handleAddOutfit}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={14} color={colors.ivory} />
            <Text style={[styles.outfitAddBtnText, { color: colors.ivory }]}>choose from photos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.outfitAddBtn, { backgroundColor: colors.ink, marginTop: spacing.md }]}
          onPress={handleAddOutfit}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color={colors.ivory} />
          <Text style={[styles.outfitAddBtnText, { color: colors.ivory }]}>add more</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ItemSheet({
  tripId,
  dayId,
  item,
  currentItemCount = 0,
  dayNumber,
  onClose,
  onOutfitsChanged,
}: ItemSheetProps) {
  const colors = useColors();
  const isEditing = !!item;
  const hasOutfitTab = dayNumber !== undefined && !isEditing;
  const { show } = useToast();
  const createItem = useCreateItem(tripId);
  const updateItem = useUpdateItem(tripId);
  const deleteItem = useDeleteItem(tripId);

  const [activeTab, setActiveTab] = useState<"plan" | "outfit">("plan");

  const [title, setTitle] = useState(item?.title ?? "");
  const [time, setTime] = useState(item?.time ?? "");
  const [category, setCategory] = useState(item?.category ?? "other");
  const [locationName, setLocationName] = useState(item?.location_name ?? "");
  const [locationLat, setLocationLat] = useState(item?.location_lat ?? 0);
  const [locationLng, setLocationLng] = useState(item?.location_lng ?? 0);
  const [photoUri, setPhotoUri] = useState(item?.photo_uri ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const linkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { canAdd } = useCanAddItem(currentItemCount);
  const canSave = title.trim().length > 0 || locationName.trim().length > 0 || link.trim().length > 0;

  useEffect(() => {
    if (item?.link) {
      fetchLinkPreview(item.link).then((preview) => {
        if (preview) setLinkPreview(preview);
      });
    }
  }, []);

  function handleLinkChange(text: string) {
    setLink(text);
    setLinkPreview(null);
    if (linkTimer.current) clearTimeout(linkTimer.current);
    if (!text.trim() || !text.includes(".")) return;
    linkTimer.current = setTimeout(async () => {
      setLinkLoading(true);
      const preview = await fetchLinkPreview(text.trim());
      setLinkLoading(false);
      if (preview) setLinkPreview(preview);
    }, 600);
  }

  function handleOpenMap() {
    if (!locationLat || !locationLng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${locationLat},${locationLng}`;
    Linking.openURL(url);
  }

  async function handleSave() {
    if (!canSave) return;
    const finalTitle = title.trim() || locationName.trim() || linkPreview?.title || link.trim();
    try {
      if (isEditing) {
        await updateItem.mutateAsync({
          itemId: item.id,
          patch: {
            title: finalTitle,
            time: time.trim() || null,
            category: category || null,
            location_name: locationName.trim() || null,
            location_lat: locationLat || null,
            location_lng: locationLng || null,
            photo_uri: photoUri.trim() || null,
            notes: notes.trim() || null,
            link: link.trim() || null,
          },
        });
      } else {
        await createItem.mutateAsync({
          trip_day_id: dayId,
          title: finalTitle,
          time: time.trim() || undefined,
          category: category || undefined,
          location_name: locationName.trim() || undefined,
          location_lat: locationLat || undefined,
          location_lng: locationLng || undefined,
          photo_uri: photoUri.trim() || undefined,
          notes: notes.trim() || undefined,
          link: link.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      show("couldn't save plan");
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteItem.mutate(item!.id, {
      onSuccess: onClose,
      onError: () => show("couldn't delete plan"),
    });
  }

  return (
    <Modal visible animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.ivory }]}>
          <View style={[styles.handle, { backgroundColor: colors.mist }]} />

          {/* Header with tabs and close button */}
          <View style={styles.sheetHeader}>
            <Text variant="title" style={styles.sheetTitle}>
              {isEditing ? "edit plan" : hasOutfitTab ? (activeTab === "plan" ? "add plan" : "add outfit") : "add plan"}
            </Text>

            {/* Tab pills (only when dayNumber is provided and not editing) */}
            {hasOutfitTab && (
              <View style={[styles.tabRow, { backgroundColor: colors.mist + "80" }]}>
                <TouchableOpacity
                  style={[
                    styles.tabPill,
                    activeTab === "plan" && [styles.tabPillActive, { backgroundColor: colors.pearl }],
                  ]}
                  onPress={() => setActiveTab("plan")}
                  activeOpacity={0.7}
                >
                  <Feather name="map-pin" size={11} color={activeTab === "plan" ? colors.ink : colors.stone} />
                  <Text style={[styles.tabPillText, { color: activeTab === "plan" ? colors.ink : colors.stone }]}>plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabPill,
                    activeTab === "outfit" && [styles.tabPillActive, { backgroundColor: colors.pearl }],
                  ]}
                  onPress={() => setActiveTab("outfit")}
                  activeOpacity={0.7}
                >
                  <Feather name="scissors" size={11} color={activeTab === "outfit" ? colors.ink : colors.stone} />
                  <Text style={[styles.tabPillText, { color: activeTab === "outfit" ? colors.ink : colors.stone }]}>outfit</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.mist }]}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={12}
            >
              <Feather name="x" size={16} color={colors.stone} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces
            contentContainerStyle={styles.scrollContent}
          >
            {/* ============ Plan Tab ============ */}
            {activeTab === "plan" && (
              <>
                {/* Location (primary field) */}
                <FieldLabel label="location" icon="map-pin" />
                <LocationPicker
                  value={locationName}
                  placeholder="search a place..."
                  onSelect={(place) => {
                    setLocationName(place.name);
                    setLocationLat(place.lat);
                    setLocationLng(place.lng);
                    if (place.photo_uri) setPhotoUri(place.photo_uri);
                  }}
                  onClear={() => {
                    setLocationName("");
                    setLocationLat(0);
                    setLocationLng(0);
                    setPhotoUri("");
                  }}
                />
                {locationName.trim().length > 0 && locationLat !== 0 && (
                  <TouchableOpacity
                    style={styles.mapLink}
                    onPress={handleOpenMap}
                    activeOpacity={0.7}
                  >
                    <Feather name="navigation" size={12} color={colors.teal} />
                    <Text style={[styles.mapLinkText, { color: colors.teal }]}>open in maps</Text>
                  </TouchableOpacity>
                )}

                {/* Category */}
                <FieldLabel label="category" icon="tag" />
                <CategoryPicker value={category} onChange={setCategory} />

                {/* Time */}
                <FieldLabel label="time" icon="clock" />
                <TimePicker
                  value={time}
                  onChange={setTime}
                  onClear={() => setTime("")}
                  placeholder="set time"
                />

                {/* Plan name (optional — location is used if empty) */}
                <FieldLabel label="plan name (optional)" icon="edit-3" />
                <TextInput
                  style={[styles.input, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl }]}
                  placeholder="e.g. sunset visit, morning coffee..."
                  placeholderTextColor={colors.stone}
                  value={title}
                  onChangeText={setTitle}
                />

                {/* Note */}
                <FieldLabel label="note" icon="file-text" />
                <TextInput
                  style={[styles.input, styles.notesInput, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl }]}
                  placeholder="any details or reminders..."
                  placeholderTextColor={colors.stone}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                {/* Link */}
                <FieldLabel label="link or reference" icon="link" />
                <View style={[styles.linkRow, { borderColor: colors.sand, backgroundColor: colors.pearl }]}>
                  <TextInput
                    style={[styles.linkInput, { color: colors.ink }]}
                    placeholder="paste a URL (booking, article, etc.)"
                    placeholderTextColor={colors.stone}
                    value={link}
                    onChangeText={handleLinkChange}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {linkLoading && <ActivityIndicator size="small" color={colors.coral} />}
                </View>

                {/* Link preview card */}
                {linkPreview && (
                  <View style={[styles.previewCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
                    {linkPreview.thumbnailUrl ? (
                      <Image source={{ uri: linkPreview.thumbnailUrl }} style={styles.previewImage} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[styles.previewImagePlaceholder, { backgroundColor: colors.gold + "20" }]}>
                        <Feather name="image" size={20} color={colors.sand} />
                      </View>
                    )}
                    <View style={styles.previewBody}>
                      <Text style={[styles.previewTitle, { color: colors.ink }]} numberOfLines={2}>{linkPreview.title}</Text>
                      <Text variant="caption" style={{ color: colors.stone }}>{linkPreview.author}</Text>
                      <View style={[styles.previewBadge, { backgroundColor: colors.stone + "10" }]}>
                        <Feather
                          name={linkPreview.source === "instagram" ? "instagram" : linkPreview.source === "pinterest" ? "heart" : "link"}
                          size={9}
                          color={colors.stone}
                        />
                        <Text style={[styles.previewBadgeText, { color: colors.stone }]}>{linkPreview.source}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {link.trim().length > 0 && !linkPreview && (
                  <TouchableOpacity
                    style={styles.mapLink}
                    onPress={() => {
                      const url = link.startsWith("http") ? link : `https://${link}`;
                      Linking.openURL(url).catch(() => show("couldn't open link"));
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="external-link" size={12} color={colors.teal} />
                    <Text style={[styles.mapLinkText, { color: colors.teal }]}>open link</Text>
                  </TouchableOpacity>
                )}

                {/* Save / Cancel / Delete */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.ink }, !canSave && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={!canSave}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" style={[styles.saveBtnText, { color: colors.ivory }]}>
                      {isEditing ? "save changes" : "add plan"}
                    </Text>
                  </TouchableOpacity>

                  {isEditing && (
                    <TouchableOpacity
                      style={styles.deleteLink}
                      onPress={handleDelete}
                      activeOpacity={0.8}
                    >
                      <Text variant="caption" style={styles.deleteLinkText}>
                        {confirmDelete ? "tap again to confirm delete" : "delete this plan"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* ============ Outfit Tab ============ */}
            {activeTab === "outfit" && dayNumber !== undefined && (
              <OutfitTabContent
                tripId={tripId}
                dayNumber={dayNumber}
                onOutfitsChanged={onOutfitsChanged}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sheetTitle: {},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Tab pills */
  tabRow: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabPillActive: {},
  tabPillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingBottom: spacing.md,
  },

  /* Field labels */
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  fieldLabelText: {
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    fontFamily: "Inter_600SemiBold",
  },

  /* Inputs */
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  /* Map / link helpers */
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
  },
  mapLinkText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  /* Link input row */
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  linkInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },

  /* Link preview */
  previewCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginTop: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    gap: 2,
  },
  previewTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 4,
  },
  previewBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 0.5,
  },

  /* Actions */
  actions: {
    marginTop: spacing.xl,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: "Inter_500Medium",
  },
  deleteLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  deleteLinkText: {
    color: "#C44",
  },

  /* Outfit tab */
  outfitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: OUTFIT_TILE_GAP,
    marginTop: spacing.sm,
  },
  outfitTile: {
    width: OUTFIT_TILE_W,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  outfitImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  outfitDeleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitEmpty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 10,
  },
  outfitEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  outfitAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 14,
    alignSelf: "stretch",
  },
  outfitAddBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
