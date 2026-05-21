import { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

const SCREEN_W = Dimensions.get("window").width;
const TILE_GAP = 8;
const TILE_W = (SCREEN_W - spacing.lg * 2 - TILE_GAP * 2) / 3;

interface PackingItem {
  id: string;
  text: string;
  packed: boolean;
  category: string;
}

interface Outfit {
  id: string;
  photoUri: string;
  name: string;
  notes: string;
  dayNumber: number | null;
  createdAt: string;
}

const CATEGORIES = [
  { key: "clothes", label: "clothes", icon: "shopping-bag" as const, color: colors.teal },
  { key: "toiletries", label: "toiletries", icon: "droplet" as const, color: colors.gold },
  { key: "electronics", label: "electronics", icon: "battery-charging" as const, color: colors.stone },
  { key: "documents", label: "documents", icon: "file-text" as const, color: colors.coral },
  { key: "other", label: "other", icon: "package" as const, color: colors.sand },
];

function packingKey(tripId: string) {
  return `packing_${tripId}`;
}

function outfitsKey(tripId: string) {
  return `outfits_${tripId}`;
}

function formatDayDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toLowerCase();
}

export default function PackingListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [items, setItems] = useState<PackingItem[]>([]);
  const [newText, setNewText] = useState("");
  const [activeCategory, setActiveCategory] = useState("clothes");
  const [loaded, setLoaded] = useState(false);

  // Outfit state
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showDayPicker, setShowDayPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(packingKey(id)),
      AsyncStorage.getItem(outfitsKey(id)),
    ]).then(([packingRaw, outfitsRaw]) => {
      if (packingRaw) setItems(JSON.parse(packingRaw));
      if (outfitsRaw) setOutfits(JSON.parse(outfitsRaw));
      setLoaded(true);
    });
  }, [id]);

  const persistItems = useCallback(
    (next: PackingItem[]) => {
      setItems(next);
      AsyncStorage.setItem(packingKey(id), JSON.stringify(next));
    },
    [id]
  );

  const persistOutfits = useCallback(
    (next: Outfit[]) => {
      setOutfits(next);
      AsyncStorage.setItem(outfitsKey(id), JSON.stringify(next));
    },
    [id]
  );

  function addItem() {
    const text = newText.trim();
    if (!text) return;
    const item: PackingItem = {
      id: Date.now().toString(),
      text,
      packed: false,
      category: activeCategory,
    };
    persistItems([...items, item]);
    setNewText("");
  }

  function toggleItem(itemId: string) {
    persistItems(items.map((i) => (i.id === itemId ? { ...i, packed: !i.packed } : i)));
  }

  function deleteItem(itemId: string) {
    persistItems(items.filter((i) => i.id !== itemId));
  }

  // Outfit actions
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
      persistOutfits([...outfits, ...newOutfits]);
    } catch {}
  }

  function deleteOutfit(outfitId: string) {
    persistOutfits(outfits.filter((o) => o.id !== outfitId));
    setViewingOutfit(null);
  }

  function assignDay(outfitId: string, dayNumber: number | null) {
    persistOutfits(outfits.map((o) => (o.id === outfitId ? { ...o, dayNumber } : o)));
    if (viewingOutfit?.id === outfitId) {
      setViewingOutfit({ ...viewingOutfit, dayNumber });
    }
    setShowDayPicker(false);
  }

  function saveOutfitDetails() {
    if (!viewingOutfit) return;
    persistOutfits(
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

  // Day-by-day outfit rows
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

  const unassignedOutfits = outfits.filter((o) => o.dayNumber === null);

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.key),
  })).filter((g) => g.items.length > 0);

  const totalPacked = items.filter((i) => i.packed).length;
  const totalItems = items.length;
  const progressPct = totalItems > 0 ? (totalPacked / totalItems) * 100 : 0;

  if (!loaded) return null;

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Feather name="chevron-left" size={16} color={colors.stone} />
          <Text variant="body" style={styles.backLink}>{trip?.title ?? "trip"}</Text>
        </TouchableOpacity>
      </View>

      <Text variant="display" style={styles.pageTitle}>packing list</Text>

      {/* Progress ring area */}
      {totalItems > 0 ? (
        <View style={styles.progressSection}>
          <View style={styles.progressCircle}>
            <Text variant="title" style={styles.progressNumber}>{totalPacked}</Text>
            <Text variant="caption" style={styles.progressOf}>of {totalItems}</Text>
          </View>
          <View style={styles.progressBarWrap}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPct}%` as any },
                  progressPct === 100 && styles.progressComplete,
                ]}
              />
            </View>
            <Text variant="caption" style={styles.progressLabel}>
              {progressPct === 100 ? "all packed!" : `${Math.round(progressPct)}% packed`}
            </Text>
          </View>
        </View>
      ) : (
        <Text variant="eyebrow" style={styles.emptySubtitle}>
          start adding items below
        </Text>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.body}
      >
        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catRow}
          contentContainerStyle={styles.catRowContent}
        >
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat.key).length;
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catTab, isActive && { backgroundColor: cat.color }]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Feather
                  name={cat.icon}
                  size={13}
                  color={isActive ? colors.ivory : colors.stone}
                />
                <Text
                  variant="caption"
                  style={[
                    styles.catTabText,
                    isActive && styles.catTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.catBadge, isActive && { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                    <Text variant="caption" style={[styles.catBadgeText, isActive && { color: colors.ivory }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Add item input */}
        <View style={styles.addRow}>
          <View style={styles.addInputWrap}>
            <Feather name="plus" size={14} color={colors.taupe} style={styles.addIcon} />
            <TextInput
              style={styles.addInput}
              placeholder={`add to ${activeCategory}…`}
              placeholderTextColor={colors.sand}
              value={newText}
              onChangeText={setNewText}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Grouped items */}
        {grouped.map((group) => {
          const packedCount = group.items.filter((i) => i.packed).length;
          return (
            <View key={group.key} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: group.color }]} />
                <Text variant="eyebrow" style={styles.groupLabel}>
                  {group.label}
                </Text>
                <Text variant="caption" style={styles.groupCount}>
                  {packedCount}/{group.items.length}
                </Text>
              </View>
              <View style={styles.groupCard}>
                {group.items.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.itemRow,
                      pressed && { backgroundColor: colors.mist + "40" },
                      idx < group.items.length - 1 && styles.itemBorder,
                    ]}
                    onPress={() => toggleItem(item.id)}
                    role="button"
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.packed && { backgroundColor: group.color, borderColor: group.color },
                      ]}
                    >
                      {item.packed && <Feather name="check" size={11} color={colors.ivory} />}
                    </View>
                    <Text
                      variant="body"
                      style={[styles.itemText, item.packed && styles.itemTextPacked]}
                    >
                      {item.text}
                    </Text>
                    <TouchableOpacity
                      onPress={() => deleteItem(item.id)}
                      style={styles.deleteBtn}
                      hitSlop={8}
                    >
                      <Feather name="x" size={12} color={colors.mist} />
                    </TouchableOpacity>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* Empty hint for active category */}
        {items.filter((i) => i.category === activeCategory).length === 0 && (
          <View style={styles.emptyCategory}>
            <Feather
              name={CATEGORIES.find((c) => c.key === activeCategory)!.icon}
              size={24}
              color={colors.mist}
            />
            <Text variant="titleItalic" style={styles.emptyText}>
              no {activeCategory} yet
            </Text>
          </View>
        )}

        {/* ============ Outfits & Styling Section ============ */}
        <View style={styles.outfitsDivider}>
          <View style={styles.outfitsDividerLine} />
          <Feather name="camera" size={12} color={colors.taupe} />
          <Text style={styles.outfitsDividerLabel}>outfits & styling</Text>
          <View style={styles.outfitsDividerLine} />
        </View>

        <Text variant="caption" style={styles.outfitsHint}>
          {outfits.length} {outfits.length === 1 ? "look" : "looks"} planned
        </Text>

        {/* Day-by-day outfit planning */}
        {dayRows.map((row) => (
          <View key={row.dayNumber} style={styles.outfitDaySection}>
            <View style={styles.outfitDayHeader}>
              <View style={styles.outfitDayBadge}>
                <Text style={styles.outfitDayBadgeText}>
                  {String(row.dayNumber).padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.outfitDayInfo}>
                <Text variant="body" style={styles.outfitDayLabel}>
                  day {row.dayNumber}
                </Text>
                <Text variant="caption" style={styles.outfitDayDate}>
                  {formatDayDate(row.date)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.outfitAddDayBtn}
                onPress={() => addOutfit(row.dayNumber)}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Feather name="plus" size={14} color={colors.taupe} />
              </TouchableOpacity>
            </View>

            {row.outfits.length > 0 ? (
              <View style={styles.outfitTilesRow}>
                {row.outfits.map((outfit) => (
                  <TouchableOpacity
                    key={outfit.id}
                    style={styles.outfitTile}
                    onPress={() => openOutfit(outfit)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: outfit.photoUri }}
                      style={styles.outfitTileImage}
                      contentFit="cover"
                      transition={200}
                    />
                    {outfit.name ? (
                      <Text variant="caption" style={styles.outfitTileName} numberOfLines={1}>
                        {outfit.name}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.outfitEmptySlot}
                onPress={() => addOutfit(row.dayNumber)}
                activeOpacity={0.7}
              >
                <Feather name="camera" size={14} color={colors.sand} />
                <Text variant="caption" style={styles.outfitEmptyText}>
                  add outfit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Unassigned / inspiration */}
        {unassignedOutfits.length > 0 && (
          <View style={styles.outfitInspiration}>
            <Text variant="eyebrow" style={styles.outfitInspirationLabel}>
              inspiration
            </Text>
            <View style={styles.outfitTilesRow}>
              {unassignedOutfits.map((outfit) => (
                <TouchableOpacity
                  key={outfit.id}
                  style={styles.outfitTile}
                  onPress={() => openOutfit(outfit)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: outfit.photoUri }}
                    style={styles.outfitTileImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {outfit.name ? (
                    <Text variant="caption" style={styles.outfitTileName} numberOfLines={1}>
                      {outfit.name}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Add inspiration button */}
        <TouchableOpacity
          style={styles.outfitAddInspirationBtn}
          onPress={() => addOutfit(null)}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={13} color={colors.stone} />
          <Text variant="body" style={styles.outfitAddInspirationText}>
            add inspiration photo
          </Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Outfit detail modal */}
      {viewingOutfit && (
        <Modal visible animationType="slide" transparent>
          <TouchableOpacity
            style={styles.outfitOverlay}
            activeOpacity={1}
            onPress={saveOutfitDetails}
          >
            <TouchableOpacity style={styles.outfitSheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.outfitHandle} />
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.outfitDetailImageWrap}>
                  <Image
                    source={{ uri: viewingOutfit.photoUri }}
                    style={styles.outfitDetailImage}
                    contentFit="cover"
                    transition={300}
                  />
                </View>

                <TextInput
                  style={styles.outfitNameInput}
                  placeholder="name this look…"
                  placeholderTextColor={colors.sand}
                  value={editName}
                  onChangeText={setEditName}
                />

                <TouchableOpacity
                  style={styles.outfitDayAssignRow}
                  onPress={() => setShowDayPicker(!showDayPicker)}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={14} color={colors.taupe} />
                  <Text variant="body" style={styles.outfitDayAssignText}>
                    {viewingOutfit.dayNumber
                      ? `day ${String(viewingOutfit.dayNumber).padStart(2, "0")}`
                      : "assign to a day"}
                  </Text>
                  <Feather
                    name={showDayPicker ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.stone}
                  />
                </TouchableOpacity>

                {showDayPicker && trip && (
                  <View style={styles.outfitDayPickerList}>
                    {viewingOutfit.dayNumber !== null && (
                      <TouchableOpacity
                        style={styles.outfitDayPickerRow}
                        onPress={() => assignDay(viewingOutfit.id, null)}
                        activeOpacity={0.7}
                      >
                        <Feather name="x-circle" size={14} color={colors.stone} />
                        <Text variant="caption" style={{ color: colors.stone, fontSize: 12 }}>
                          unassign
                        </Text>
                      </TouchableOpacity>
                    )}
                    {trip.trip_days.map((d) => {
                      const isSelected = viewingOutfit.dayNumber === d.day_number;
                      return (
                        <TouchableOpacity
                          key={d.day_number}
                          style={[
                            styles.outfitDayPickerRow,
                            isSelected && { backgroundColor: colors.ink },
                          ]}
                          onPress={() => assignDay(viewingOutfit.id, d.day_number)}
                          activeOpacity={0.7}
                        >
                          <Text
                            variant="body"
                            style={{ fontSize: 14, fontFamily: "Inter_500Medium", color: isSelected ? colors.ivory : colors.ink }}
                          >
                            day {String(d.day_number).padStart(2, "0")}
                          </Text>
                          <Text
                            variant="caption"
                            style={{ flex: 1, fontSize: 12, color: isSelected ? colors.ivory : colors.stone }}
                          >
                            {formatDayDate(d.date)}
                          </Text>
                          {isSelected && <Feather name="check" size={14} color={colors.ivory} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TextInput
                  style={styles.outfitNotesInput}
                  placeholder="styling notes…"
                  placeholderTextColor={colors.sand}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                />

                <TouchableOpacity
                  style={styles.outfitSaveBtn}
                  onPress={saveOutfitDetails}
                  activeOpacity={0.8}
                >
                  <Text variant="body" style={styles.outfitSaveBtnText}>done</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outfitDeleteLink}
                  onPress={() => deleteOutfit(viewingOutfit.id)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={12} color="#C44" />
                  <Text variant="caption" style={{ color: "#C44", fontSize: 12 }}>
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
    color: colors.stone,
    fontSize: 13,
  },
  pageTitle: {
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.moss,
    alignItems: "center",
    justifyContent: "center",
  },
  progressNumber: {
    fontSize: 20,
    lineHeight: 22,
    color: colors.moss,
  },
  progressOf: {
    fontSize: 9,
    color: colors.stone,
    marginTop: -2,
  },
  progressBarWrap: {
    flex: 1,
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.mist,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.moss,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: colors.moss,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.stone,
  },
  body: {
    flex: 1,
  },
  catRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  catRowContent: {
    gap: 8,
  },
  catTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    backgroundColor: colors.pearl,
  },
  catTabText: {
    fontSize: 12,
    color: colors.stone,
    fontFamily: "Inter_500Medium",
  },
  catTabTextActive: {
    color: colors.ivory,
  },
  catBadge: {
    backgroundColor: colors.mist,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  catBadgeText: {
    fontSize: 10,
    color: colors.stone,
    fontFamily: "Inter_500Medium",
  },
  addRow: {
    marginBottom: spacing.lg,
  },
  addInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.pearl,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    paddingHorizontal: spacing.md,
  },
  addIcon: {
    marginRight: 10,
  },
  addInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  groupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groupLabel: {
    flex: 1,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  groupCount: {
    color: colors.stone,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  groupCard: {
    backgroundColor: colors.pearl,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  itemTextPacked: {
    textDecorationLine: "line-through",
    color: colors.stone,
    opacity: 0.6,
  },
  deleteBtn: {
    padding: 4,
    opacity: 0.4,
  },
  emptyCategory: {
    alignItems: "center",
    paddingVertical: spacing.xl * 1.5,
    gap: 8,
  },
  emptyText: {
    color: colors.stone,
  },

  /* Outfits section divider */
  outfitsDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  outfitsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.mist,
  },
  outfitsDividerLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.taupe,
    fontFamily: "Inter_600SemiBold",
  },
  outfitsHint: {
    textAlign: "center",
    color: colors.stone,
    fontSize: 11,
    marginBottom: spacing.md,
  },

  /* Day-by-day outfit rows */
  outfitDaySection: {
    marginBottom: spacing.md,
  },
  outfitDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  outfitDayBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitDayBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.ink,
  },
  outfitDayInfo: {
    flex: 1,
    gap: 1,
  },
  outfitDayLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  outfitDayDate: {
    fontSize: 11,
    color: colors.taupe,
  },
  outfitAddDayBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  outfitTilesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },
  outfitTile: {
    width: TILE_W,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
  },
  outfitTileImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  outfitTileName: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  outfitEmptySlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.pearl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.mist,
    borderStyle: "dashed",
    paddingVertical: 20,
  },
  outfitEmptyText: {
    color: colors.sand,
    fontSize: 12,
  },

  /* Inspiration */
  outfitInspiration: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  outfitInspirationLabel: {
    marginBottom: 8,
  },
  outfitAddInspirationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    marginTop: spacing.sm,
  },
  outfitAddInspirationText: {
    fontSize: 13,
    color: colors.stone,
  },

  /* Outfit detail modal */
  outfitOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  outfitSheet: {
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "90%",
  },
  outfitHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mist,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  outfitDetailImageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  outfitDetailImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    maxHeight: 300,
  },
  outfitNameInput: {
    fontSize: 18,
    fontFamily: "CormorantGaramond_700Bold",
    color: colors.ink,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
    marginBottom: spacing.md,
  },
  outfitDayAssignRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.pearl,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    marginBottom: spacing.sm,
  },
  outfitDayAssignText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
  },
  outfitDayPickerList: {
    marginBottom: spacing.md,
    gap: 2,
  },
  outfitDayPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  outfitNotesInput: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 15,
    color: colors.stone,
    lineHeight: 22,
    minHeight: 40,
    marginBottom: spacing.lg,
  },
  outfitSaveBtn: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  outfitSaveBtnText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
  outfitDeleteLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
});
