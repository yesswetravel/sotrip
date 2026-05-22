import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../../features/design-system";
import { useTrip } from "../../../../features/trips/hooks";
import { useColors } from "../../../../features/theme/ThemeProvider";
import { spacing } from "../../../../theme/spacing";

const SCREEN_W = Dimensions.get("window").width;
const GAP = 6;
const TILE_W = (SCREEN_W - spacing.lg * 2 - GAP) / 2;

interface Outfit {
  id: string;
  photoUri: string;
  name: string;
  notes: string;
  dayNumber: number | null;
  createdAt: string;
}

function formatDayDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toLowerCase();
}

export default function DayLookScreen() {
  const colors = useColors();
  const { id, n } = useLocalSearchParams<{ id: string; n: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);
  const dayNumber = parseInt(n, 10);

  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const storageKeyVal = `outfits_${id}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKeyVal).then((raw) => {
      if (raw) setAllOutfits(JSON.parse(raw));
      setLoaded(true);
    });
  }, [id]);

  const dayOutfits = allOutfits.filter((o) => o.dayNumber === dayNumber);

  const persist = useCallback(
    (next: Outfit[]) => {
      setAllOutfits(next);
      AsyncStorage.setItem(storageKeyVal, JSON.stringify(next));
    },
    [storageKeyVal]
  );

  async function addPhotos() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      if (result.canceled || result.assets.length === 0) return;
      const newOutfits: Outfit[] = result.assets.map((asset, idx) => ({
        id: `${Date.now()}_${idx}`,
        photoUri: asset.uri,
        name: "",
        notes: "",
        dayNumber,
        createdAt: new Date().toISOString(),
      }));
      persist([...allOutfits, ...newOutfits]);
    } catch {}
  }

  function deleteOutfit(outfitId: string) {
    persist(allOutfits.filter((o) => o.id !== outfitId));
    setViewingOutfit(null);
  }

  function saveDetails() {
    if (!viewingOutfit) return;
    persist(
      allOutfits.map((o) =>
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
  }

  const currentDay = trip?.trip_days.find((d) => d.day_number === dayNumber);

  if (!loaded) return null;

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">day {String(dayNumber).padStart(2, "0")}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.titleSection}>
        <Text variant="display" style={styles.pageTitle}>
          day {String(dayNumber).padStart(2, "0")} look
        </Text>
        <Text variant="eyebrow" style={styles.dateText}>
          {formatDayDate(currentDay?.date ?? null)}
        </Text>
        <View style={[styles.privacyBadge, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <View style={[styles.privacyDot, { backgroundColor: colors.coral }]} />
          <Text variant="caption" style={{ fontSize: 9, color: colors.stone, fontFamily: "Inter_500Medium" }}>only you</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Photo grid */}
        {dayOutfits.length > 0 ? (
          <View style={styles.grid}>
            {dayOutfits.map((outfit) => (
              <TouchableOpacity
                key={outfit.id}
                style={[styles.tile, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
                onPress={() => openOutfit(outfit)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: outfit.photoUri }}
                  style={styles.tileImage}
                  contentFit="cover"
                  transition={200}
                />
                {outfit.name ? (
                  <View style={styles.tileNameWrap}>
                    <Text variant="caption" style={[styles.tileName, { color: colors.ink }]} numberOfLines={1}>
                      {outfit.name}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}

            {/* Add more tile */}
            <TouchableOpacity
              style={[styles.addTile, { borderColor: colors.mist, backgroundColor: colors.pearl }]}
              onPress={addPhotos}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={20} color={colors.sand} />
              <Text variant="caption" style={{ fontSize: 11, color: colors.sand, fontFamily: "Inter_500Medium" }}>add</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.taupe + "14" }]}>
              <Feather name="camera" size={28} color={colors.taupe} />
            </View>
            <Text variant="titleItalic" style={{ color: colors.stone, fontSize: 18 }}>
              no looks planned yet
            </Text>
            <Text variant="caption" style={{ color: colors.sand, textAlign: "center" }}>
              add outfit photos for day {dayNumber}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.ink }]}
              onPress={addPhotos}
              activeOpacity={0.8}
            >
              <Feather name="camera" size={14} color={colors.pearl} />
              <Text variant="body" style={{ color: colors.pearl, fontFamily: "Inter_500Medium", fontSize: 13 }}>add photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary */}
        {dayOutfits.length > 0 && (
          <Text variant="caption" style={{ textAlign: "center", color: colors.stone, fontSize: 11, marginTop: spacing.md }}>
            {dayOutfits.length} {dayOutfits.length === 1 ? "look" : "looks"} for this day
          </Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating add button */}
      {dayOutfits.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.ink }]}
          onPress={addPhotos}
          activeOpacity={0.85}
        >
          <Feather name="camera" size={16} color={colors.ivory} />
          <Text variant="body" style={{ color: colors.ivory, fontFamily: "Inter_500Medium" }}>add photos</Text>
        </TouchableOpacity>
      )}

      {/* Outfit detail modal */}
      {viewingOutfit && (
        <Modal visible animationType="fade" transparent>
          <View style={styles.overlay}>
            <View style={styles.fullImageWrap}>
              <Image
                source={{ uri: viewingOutfit.photoUri }}
                style={styles.fullImage}
                contentFit="contain"
                transition={200}
              />

              {/* Top bar */}
              <View style={styles.fullTopBar}>
                <TouchableOpacity
                  style={styles.fullCloseBtn}
                  onPress={saveDetails}
                  activeOpacity={0.8}
                >
                  <Feather name="x" size={18} color={colors.pearl} />
                </TouchableOpacity>
              </View>

              {/* Bottom bar */}
              <View style={styles.fullBottomBar}>
                <TextInput
                  style={[styles.fullNameInput, { color: colors.pearl }]}
                  placeholder="name this look…"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={editName}
                  onChangeText={setEditName}
                  returnKeyType="done"
                  onSubmitEditing={saveDetails}
                />
                <TextInput
                  style={styles.fullNotesInput}
                  placeholder="styling notes…"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                />
                <View style={styles.fullActions}>
                  <TouchableOpacity
                    style={styles.fullSaveBtn}
                    onPress={saveDetails}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" style={{ color: colors.pearl, fontFamily: "Inter_500Medium", fontSize: 14 }}>done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteOutfit(viewingOutfit.id)}
                    activeOpacity={0.7}
                    style={styles.fullDeleteBtn}
                  >
                    <Feather name="trash-2" size={14} color="#F88" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 28,
  },
  dateText: {
    marginTop: 4,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  privacyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    width: TILE_W,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  tileNameWrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tileName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  addTile: {
    width: TILE_W,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: 10,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  /* Full-screen detail modal */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  fullImageWrap: {
    flex: 1,
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    flex: 1,
  },
  fullTopBar: {
    position: "absolute",
    top: 56,
    right: spacing.lg,
  },
  fullCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  fullNameInput: {
    fontSize: 20,
    fontFamily: "CormorantGaramond_700Bold",
    paddingVertical: 6,
    marginBottom: 4,
  },
  fullNotesInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    paddingVertical: 4,
    minHeight: 30,
    marginBottom: spacing.md,
  },
  fullActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fullSaveBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  fullDeleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
