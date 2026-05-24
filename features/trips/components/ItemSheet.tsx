import { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "../../design-system";
import { LocationPicker, TimePicker } from "../../shared";
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
  /** Called after an item is successfully deleted (use to navigate away) */
  onDeleted?: () => void;
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
  onDeleted,
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { canAdd } = useCanAddItem(currentItemCount);
  const canSave =
    title.trim().length > 0 ||
    locationName.trim().length > 0 ||
    time.trim().length > 0 ||
    photoUri.trim().length > 0;

  function handleOpenMap() {
    if (!locationLat || !locationLng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${locationLat},${locationLng}`;
    Linking.openURL(url);
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError("");
    const finalTitle = title.trim() || locationName.trim();
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
        });
      }
      onClose();
    } catch (err: any) {
      setSaving(false);
      const msg = err?.message?.includes("session")
        ? "session expired — please sign in again"
        : "couldn't save — check your connection and try again";
      setSaveError(msg);
    }
  }

  async function handlePickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      show("couldn't pick photo");
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteItem.mutate(item!.id, {
      onSuccess: () => { onDeleted ? onDeleted() : onClose(); },
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
                {/* Plan name */}
                <TextInput
                  style={[styles.input, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl, marginTop: spacing.sm }]}
                  placeholder="plan name"
                  placeholderTextColor={colors.stone}
                  value={title}
                  onChangeText={setTitle}
                />

                {/* Location — zIndex keeps dropdown above fields below */}
                <View style={{ marginTop: spacing.sm, zIndex: 20 }}>
                  <LocationPicker
                    value={locationName}
                    placeholder="search location..."
                    onSelect={(place) => {
                      setLocationName(place.name);
                      setLocationLat(place.lat);
                      setLocationLng(place.lng);
                      if (place.photo_uri && !photoUri) setPhotoUri(place.photo_uri);
                    }}
                    onClear={() => {
                      setLocationName("");
                      setLocationLat(0);
                      setLocationLng(0);
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
                </View>

                {/* Photo — preview or input options */}
                <View style={{ marginTop: spacing.sm, zIndex: 1 }}>
                  {photoUri ? (
                    <>
                      <View style={[styles.photoPreview, { borderColor: colors.mist }]}>
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.photoPreviewImage}
                          contentFit="cover"
                          transition={200}
                        />
                        <TouchableOpacity
                          style={styles.photoRemoveBtn}
                          onPress={() => setPhotoUri("")}
                          activeOpacity={0.7}
                          hitSlop={8}
                        >
                          <Feather name="x" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      {photoUri.startsWith("http") && (
                        <Text variant="caption" style={[styles.photoSourceHint, { color: colors.taupe }]}>
                          from google · tap × to change
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.photoPickBtn, { borderColor: colors.sand, backgroundColor: colors.pearl }]}
                        onPress={handlePickPhoto}
                        activeOpacity={0.8}
                      >
                        <Feather name="image" size={16} color={colors.coral} />
                        <Text style={[styles.photoPickText, { color: colors.stone }]}>tap, paste, or drag photo</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.input, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl, marginTop: spacing.sm }]}
                        placeholder="or paste image URL..."
                        placeholderTextColor={colors.stone}
                        value=""
                        onChangeText={setPhotoUri}
                        keyboardType="url"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </>
                  )}
                </View>

                {/* Time */}
                <View style={{ marginTop: spacing.sm, zIndex: 1 }}>
                  <TimePicker
                    value={time}
                    onChange={setTime}
                    onClear={() => setTime("")}
                    placeholder="set time"
                  />
                </View>

                {/* Notes — long text with links */}
                <TextInput
                  style={[styles.input, styles.notesInput, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl, marginTop: spacing.sm }]}
                  placeholder="notes, links, details..."
                  placeholderTextColor={colors.stone}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

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

          {/* Save / Cancel / Delete — fixed at bottom, outside ScrollView */}
          {activeTab === "plan" && (
            <View style={styles.actions}>
              {saveError ? (
                <View style={[styles.errorBanner, { backgroundColor: "#C4444420" }]}>
                  <Feather name="alert-circle" size={14} color="#C44" />
                  <Text variant="caption" style={{ color: "#C44", flex: 1 }}>{saveError}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.ink }, (!canSave || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave || saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.ivory} />
                ) : (
                  <Text variant="body" style={[styles.saveBtnText, { color: colors.ivory }]}>
                    {isEditing ? "save changes" : "add plan"}
                  </Text>
                )}
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
          )}
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
    fontFamily: "InstrumentSans_500Medium",
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingBottom: spacing.md,
  },

  /* Inputs */
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 15,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  /* Photo field */
  photoPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 14,
    borderStyle: "dashed" as any,
  },
  photoPickText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  photoPreview: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  photoPreviewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  photoSourceHint: {
    marginTop: 6,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "InstrumentSans_400Regular",
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
    fontFamily: "InstrumentSans_500Medium",
  },

  /* Actions */
  actions: {
    marginTop: spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
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
    fontFamily: "InstrumentSans_500Medium",
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
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
});
