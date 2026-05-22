import { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

interface Outfit {
  id: string;
  photoUri: string;
  name: string;
  notes: string;
  dayNumber: number | null;
  createdAt: string;
}

const SCREEN_W = Dimensions.get("window").width;
const TILE_GAP = 8;
const TILE_W = (SCREEN_W - spacing.lg * 2 - TILE_GAP * 2) / 3;

function storageKey(tripId: string) {
  return `outfits_${tripId}`;
}

function formatDayDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toLowerCase();
}

function formatDayDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toLowerCase();
}

export default function OutfitsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [addingForDay, setAddingForDay] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKey(id)).then((raw) => {
      if (raw) setOutfits(JSON.parse(raw));
      setLoaded(true);
    });
  }, [id]);

  const persist = useCallback(
    (next: Outfit[]) => {
      setOutfits(next);
      AsyncStorage.setItem(storageKey(id), JSON.stringify(next));
    },
    [id]
  );

  async function addOutfit(dayNumber: number | null) {
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
      // silently fail on web / permission denied
    }
  }

  function deleteOutfit(outfitId: string) {
    persist(outfits.filter((o) => o.id !== outfitId));
    setViewingOutfit(null);
  }

  function assignDay(outfitId: string, dayNumber: number | null) {
    persist(outfits.map((o) => (o.id === outfitId ? { ...o, dayNumber } : o)));
    if (viewingOutfit?.id === outfitId) {
      setViewingOutfit({ ...viewingOutfit, dayNumber });
    }
    setShowDayPicker(false);
  }

  function saveOutfitDetails() {
    if (!viewingOutfit) return;
    persist(
      outfits.map((o) =>
        o.id === viewingOutfit.id
          ? { ...o, name: editName.trim(), notes: editNotes.trim() }
          : o
      )
    );
    setViewingOutfit(null);
  }

  function openOutfit(outfit: Outfit) {
    setViewingOutfit(outfit);
    setEditName(outfit.name);
    setEditNotes(outfit.notes);
    setShowDayPicker(false);
  }

  // Build day-by-day view with all trip days
  const dayRows = useMemo(() => {
    if (!trip) return [];
    const outfitMap = new Map<number, Outfit[]>();
    outfits.forEach((o) => {
      if (o.dayNumber !== null) {
        const arr = outfitMap.get(o.dayNumber) || [];
        arr.push(o);
        outfitMap.set(o.dayNumber, arr);
      }
    });
    return trip.trip_days.map((d) => ({
      dayNumber: d.day_number,
      date: d.date,
      outfits: outfitMap.get(d.day_number) || [],
    }));
  }, [outfits, trip]);

  const unassigned = outfits.filter((o) => o.dayNumber === null);
  const totalAssigned = outfits.length - unassigned.length;

  if (!loaded) return null;

  return (
    <Container logo>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Feather name="chevron-left" size={20} color={colors.stone} />
          <Text variant="body" style={[styles.backLink, { color: colors.stone }]}>{trip?.title ?? "trip"}</Text>
        </TouchableOpacity>
      </View>

      <Text variant="display" style={styles.pageTitle}>outfits</Text>
      <Text variant="eyebrow" style={styles.subtitle}>
        {outfits.length} {outfits.length === 1 ? "look" : "looks"}
        {totalAssigned > 0 ? ` · ${totalAssigned} assigned` : ""}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
        {/* Day-by-day outfit planning */}
        {dayRows.map((row) => (
          <View key={row.dayNumber} style={styles.daySection}>
            {/* Day header with number + date */}
            <View style={styles.dayHeader}>
              <View style={[styles.dayNumberWrap, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
                <Text variant="title" style={[styles.dayNumber, { color: colors.ink }]}>
                  {String(row.dayNumber).padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.dayInfo}>
                <Text variant="body" style={[styles.dayLabel, { color: colors.ink }]}>
                  day {row.dayNumber}
                </Text>
                <Text variant="caption" style={{ fontSize: 12, color: colors.taupe, fontFamily: "Inter_400Regular" }}>
                  {formatDayDate(row.date)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addDayBtn, { backgroundColor: colors.pearl, borderColor: colors.sand }]}
                onPress={() => addOutfit(row.dayNumber)}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Feather name="plus" size={14} color={colors.taupe} />
              </TouchableOpacity>
            </View>

            {/* Outfits for this day */}
            {row.outfits.length > 0 ? (
              <View style={styles.dayOutfitsRow}>
                {row.outfits.map((outfit) => (
                  <TouchableOpacity
                    key={outfit.id}
                    style={[styles.outfitTile, { backgroundColor: colors.pearl, borderColor: colors.mist, shadowColor: colors.ink }]}
                    onPress={() => openOutfit(outfit)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: outfit.photoUri }}
                      style={styles.outfitImage}
                      contentFit="cover"
                      transition={200}
                    />
                    {outfit.name ? (
                      <Text variant="caption" style={[styles.outfitName, { color: colors.ink }]} numberOfLines={1}>
                        {outfit.name}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.emptyDaySlot, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
                onPress={() => addOutfit(row.dayNumber)}
                activeOpacity={0.7}
              >
                <Feather name="camera" size={16} color={colors.sand} />
                <Text variant="caption" style={{ color: colors.sand, fontSize: 13 }}>
                  add outfit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Inspiration / unassigned */}
        {unassigned.length > 0 && (
          <View style={styles.inspirationSection}>
            <Text variant="eyebrow" style={styles.sectionLabel}>inspiration</Text>
            <Text variant="caption" style={{ color: colors.sand, fontSize: 11, marginBottom: spacing.sm }}>
              not assigned to any day yet
            </Text>
            <View style={styles.grid}>
              {unassigned.map((outfit) => (
                <TouchableOpacity
                  key={outfit.id}
                  style={[styles.outfitTile, { backgroundColor: colors.pearl, borderColor: colors.mist, shadowColor: colors.ink }]}
                  onPress={() => openOutfit(outfit)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: outfit.photoUri }}
                    style={styles.outfitImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {outfit.name ? (
                    <Text variant="caption" style={[styles.outfitName, { color: colors.ink }]} numberOfLines={1}>
                      {outfit.name}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty state when no outfits at all */}
        {outfits.length === 0 && dayRows.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.taupe + "14" }]}>
              <Feather name="camera" size={24} color={colors.taupe} />
            </View>
            <Text variant="titleItalic" style={{ color: colors.stone }}>
              plan your travel looks
            </Text>
            <Text variant="caption" style={{ color: colors.sand, textAlign: "center" }}>
              add outfit photos and assign them to days
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add inspiration button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.ink }]}
        onPress={() => addOutfit(null)}
        activeOpacity={0.85}
      >
        <Feather name="camera" size={16} color={colors.ivory} style={{ marginRight: 6 }} />
        <Text variant="body" style={{ color: colors.ivory, fontFamily: "Inter_500Medium" }}>add inspiration</Text>
      </TouchableOpacity>

      {/* Outfit detail modal */}
      {viewingOutfit && (
        <Modal visible animationType="slide" transparent>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={saveOutfitDetails}
          >
            <TouchableOpacity style={[styles.sheet, { backgroundColor: colors.ivory }]} activeOpacity={1} onPress={() => {}}>
              <View style={[styles.handle, { backgroundColor: colors.mist }]} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Photo */}
                <View style={styles.detailImageWrap}>
                  <Image
                    source={{ uri: viewingOutfit.photoUri }}
                    style={styles.detailImage}
                    contentFit="cover"
                    transition={300}
                  />
                </View>

                {/* Name */}
                <TextInput
                  style={[styles.nameInput, { color: colors.ink, borderBottomColor: colors.mist }]}
                  placeholder="name this look…"
                  placeholderTextColor={colors.sand}
                  value={editName}
                  onChangeText={setEditName}
                />

                {/* Day assignment */}
                <TouchableOpacity
                  style={[styles.dayAssignRow, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
                  onPress={() => setShowDayPicker(!showDayPicker)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={14} color={colors.taupe} />
                  <Text variant="body" style={[styles.dayAssignText, { color: colors.ink }]}>
                    {viewingOutfit.dayNumber
                      ? `day ${String(viewingOutfit.dayNumber).padStart(2, "0")} — ${formatDayDateShort(
                          trip?.trip_days.find((d) => d.day_number === viewingOutfit.dayNumber)?.date ?? null
                        )}`
                      : "assign to a day"}
                  </Text>
                  <Feather
                    name={showDayPicker ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.stone}
                  />
                </TouchableOpacity>

                {/* Day picker */}
                {showDayPicker && trip && (
                  <View style={styles.dayPickerList}>
                    {viewingOutfit.dayNumber !== null && (
                      <TouchableOpacity
                        style={styles.dayPickerRow}
                        onPress={() => assignDay(viewingOutfit.id, null)}
                        activeOpacity={0.7}
                      >
                        <Feather name="x-circle" size={14} color={colors.stone} />
                        <Text variant="caption" style={{ color: colors.stone, fontSize: 12 }}>
                          unassign from day
                        </Text>
                      </TouchableOpacity>
                    )}
                    {trip.trip_days.map((d) => {
                      const isSelected = viewingOutfit.dayNumber === d.day_number;
                      return (
                        <TouchableOpacity
                          key={d.day_number}
                          style={[
                            styles.dayPickerRow,
                            isSelected && { backgroundColor: colors.ink },
                          ]}
                          onPress={() => assignDay(viewingOutfit.id, d.day_number)}
                          activeOpacity={0.7}
                        >
                          <Text
                            variant="body"
                            style={[
                              styles.dayPickerDayNum,
                              { color: colors.ink },
                              isSelected && { color: colors.ivory },
                            ]}
                          >
                            day {String(d.day_number).padStart(2, "0")}
                          </Text>
                          <Text
                            variant="caption"
                            style={[
                              styles.dayPickerDate,
                              { color: colors.stone },
                              isSelected && { color: colors.ivory },
                            ]}
                          >
                            {formatDayDate(d.date)}
                          </Text>
                          {isSelected && (
                            <Feather name="check" size={14} color={colors.ivory} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Notes */}
                <TextInput
                  style={[styles.notesInput, { color: colors.stone }]}
                  placeholder="styling notes…"
                  placeholderTextColor={colors.sand}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                />

                {/* Actions */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.ink }]}
                  onPress={saveOutfitDetails}
                  activeOpacity={0.8}
                >
                  <Text variant="body" style={{ color: colors.ivory, fontFamily: "Inter_500Medium" }}>done</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteLink}
                  onPress={() => deleteOutfit(viewingOutfit.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={12} color="#C44" />
                  <Text variant="caption" style={styles.deleteLinkText}>
                    remove outfit
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLink: {
    fontSize: 13,
  },
  pageTitle: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },

  /* Day-by-day sections */
  daySection: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  dayNumberWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 16,
  },
  dayInfo: {
    flex: 1,
    gap: 1,
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  addDayBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  dayOutfitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },
  emptyDaySlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 24,
  },

  /* Outfit tiles */
  outfitTile: {
    width: TILE_W,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  outfitImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  outfitName: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  /* Inspiration section */
  inspirationSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  /* Add button */
  addButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Detail modal */
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
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
    marginBottom: spacing.md,
  },
  detailImageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  detailImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    maxHeight: 300,
  },
  nameInput: {
    fontSize: 18,
    fontFamily: "CormorantGaramond_700Bold",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  dayAssignRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  dayAssignText: {
    flex: 1,
    fontSize: 14,
  },
  dayPickerList: {
    marginBottom: spacing.md,
    gap: 2,
  },
  dayPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dayPickerDayNum: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  dayPickerDate: {
    flex: 1,
    fontSize: 12,
  },
  notesInput: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 40,
    marginBottom: spacing.lg,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  deleteLinkText: {
    color: "#C44",
    fontSize: 12,
  },
});
