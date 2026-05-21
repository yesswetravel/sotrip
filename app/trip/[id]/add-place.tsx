import { useState, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../../features/design-system";
import {
  useTrip,
  useCreateItem,
} from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

const { width: SW } = Dimensions.get("window");

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "food", label: "food", icon: "coffee" as const, color: colors.coral },
  { id: "culture", label: "culture", icon: "book-open" as const, color: colors.teal },
  { id: "nature", label: "nature", icon: "sun" as const, color: colors.gold },
  { id: "shopping", label: "shopping", icon: "shopping-bag" as const, color: "#8B7BB5" },
  { id: "nightlife", label: "nightlife", icon: "moon" as const, color: colors.ink },
  { id: "transport", label: "transport", icon: "navigation" as const, color: colors.stone },
];

/* ------------------------------------------------------------------ */
/*  Mock Google Places search                                          */
/* ------------------------------------------------------------------ */

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number;
  priceLevel: string;
  icon: string;
}

const MOCK_PLACES: PlaceResult[] = [
  { id: "1", name: "Café de Flore", address: "172 Boulevard Saint-Germain, Paris", category: "food", rating: 4.3, priceLevel: "$$$", icon: "coffee" },
  { id: "2", name: "Shakespeare and Company", address: "37 Rue de la Bûcherie, Paris", category: "culture", rating: 4.7, priceLevel: "$$", icon: "book-open" },
  { id: "3", name: "Musée d'Orsay", address: "1 Rue de la Légion d'Honneur, Paris", category: "culture", rating: 4.8, priceLevel: "$$", icon: "book-open" },
  { id: "4", name: "Le Comptoir du Panthéon", address: "5 Rue Soufflot, Paris", category: "food", rating: 4.1, priceLevel: "$$", icon: "coffee" },
  { id: "5", name: "Jardin du Luxembourg", address: "Rue de Médicis, Paris", category: "nature", rating: 4.7, priceLevel: "free", icon: "sun" },
  { id: "6", name: "Galeries Lafayette", address: "40 Boulevard Haussmann, Paris", category: "shopping", rating: 4.4, priceLevel: "$$$", icon: "shopping-bag" },
  { id: "7", name: "Le Marais Walking Tour", address: "Le Marais, 4th arr., Paris", category: "culture", rating: 4.5, priceLevel: "$$", icon: "book-open" },
  { id: "8", name: "Pont Alexandre III", address: "Pont Alexandre III, Paris", category: "nature", rating: 4.8, priceLevel: "free", icon: "sun" },
];

function searchPlaces(query: string, categoryFilter: string | null): PlaceResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return MOCK_PLACES.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    const matchesCat = !categoryFilter || p.category === categoryFilter;
    return matchesQuery && matchesCat;
  });
}

/* ------------------------------------------------------------------ */
/*  Pinterest parser                                                   */
/* ------------------------------------------------------------------ */

function parsePinterestUrl(url: string): { name: string; location: string } | null {
  if (!url.trim()) return null;
  if (url.includes("pin.it") || url.includes("pinterest.com") || url.includes("pin/")) {
    return { name: "pinned place", location: "from pinterest" };
  }
  if (url.includes("google.com/maps") || url.includes("goo.gl/maps")) {
    return { name: "saved place", location: "from google maps" };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Category chip                                                      */
/* ------------------------------------------------------------------ */

function CategoryChip({
  cat,
  active,
  onPress,
}: {
  cat: (typeof CATEGORIES)[0];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.catChip,
        active && { backgroundColor: cat.color + "18", borderColor: cat.color },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <Feather name={cat.icon} size={10} color={active ? cat.color : colors.stone} />
      <Text style={[s.catChipText, active && { color: cat.color }]}>{cat.label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AddPlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);
  const createItem = useCreateItem(id);

  // Search
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected place (from search or link)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  // Manual / link entry
  const [showLink, setShowLink] = useState(false);
  const [pastedUrl, setPastedUrl] = useState("");
  const [linkParsed, setLinkParsed] = useState(false);

  // Place details (editable after selection)
  const [placeName, setPlaceName] = useState("");
  const [placeLocation, setPlaceLocation] = useState("");
  const [placeCategory, setPlaceCategory] = useState("other");
  const [placeNotes, setPlaceNotes] = useState("");
  const [placeTime, setPlaceTime] = useState("");
  const [placeEndTime, setPlaceEndTime] = useState("");

  // Day selection
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const days = useMemo(
    () =>
      trip?.trip_days.map((d) => ({
        id: d.id,
        dayNumber: d.day_number,
        date: d.date,
        label: d.title,
        itemCount: d.trip_items.length,
      })) ?? [],
    [trip]
  );

  function handleSearch(text: string) {
    setQuery(text);
    setSelectedPlace(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      setResults(searchPlaces(text, catFilter));
      setSearching(false);
    }, 400);
  }

  function handleCategoryToggle(catId: string) {
    const next = catFilter === catId ? null : catId;
    setCatFilter(next);
    if (query.trim()) {
      setResults(searchPlaces(query, next));
    }
  }

  function handleSelectResult(place: PlaceResult) {
    setSelectedPlace(place);
    setPlaceName(place.name);
    setPlaceLocation(place.address);
    setPlaceCategory(place.category);
    setQuery("");
    setResults([]);
  }

  function handlePasteLink(text: string) {
    setPastedUrl(text);
    setLinkParsed(false);
    const parsed = parsePinterestUrl(text);
    if (parsed) {
      setPlaceName(parsed.name);
      setPlaceLocation(parsed.location);
      setLinkParsed(true);
    }
  }

  function handleSave() {
    if (!placeName.trim() || !selectedDayId) return;
    createItem.mutate(
      {
        trip_day_id: selectedDayId,
        title: placeName.trim(),
        subtitle: placeNotes.trim() || undefined,
        time: placeTime.trim() || undefined,
        location_name: placeLocation.trim() || undefined,
        category: placeCategory,
      },
      { onSuccess: () => router.back() }
    );
  }

  function formatDayDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toLowerCase();
  }

  const canSave = placeName.trim() && selectedDayId;
  const showDetails = selectedPlace || linkParsed || placeName.trim();

  if (!trip) return null;

  return (
    <Container>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={18} color={colors.stone} />
        </TouchableOpacity>
        <Text variant="eyebrow">add place</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}
      >
        {/* Search bar */}
        <View style={s.searchBar}>
          <Feather name="search" size={14} color={colors.sand} />
          <TextInput
            style={s.searchInput}
            placeholder="search a place..."
            placeholderTextColor={colors.sand}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={colors.coral} />}
          {query.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }} hitSlop={8}>
              <Feather name="x" size={14} color={colors.sand} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
        >
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              cat={cat}
              active={catFilter === cat.id}
              onPress={() => handleCategoryToggle(cat.id)}
            />
          ))}
        </ScrollView>

        {/* Search results */}
        {results.length > 0 && (
          <View style={s.resultsCard}>
            {results.map((place, i) => {
              const catConfig = CATEGORIES.find((c) => c.id === place.category);
              return (
                <View key={place.id}>
                  {i > 0 && <View style={s.resultDivider} />}
                  <TouchableOpacity
                    style={s.resultRow}
                    onPress={() => handleSelectResult(place)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.resultIcon, { backgroundColor: (catConfig?.color ?? colors.stone) + "14" }]}>
                      <Feather
                        name={(catConfig?.icon ?? "map-pin") as any}
                        size={13}
                        color={catConfig?.color ?? colors.stone}
                      />
                    </View>
                    <View style={s.resultInfo}>
                      <Text style={s.resultName}>{place.name}</Text>
                      <Text variant="caption" style={s.resultAddr}>{place.address}</Text>
                      <Text variant="caption" style={s.resultMeta}>
                        {"★"} {place.rating} · {place.category} · {place.priceLevel}
                      </Text>
                    </View>
                    <View style={s.addBtnSm}>
                      <Feather name="plus" size={14} color={colors.pearl} />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* No results */}
        {query.trim().length > 2 && !searching && results.length === 0 && (
          <View style={s.noResults}>
            <Text variant="caption" style={s.noResultsText}>
              no results — try a different name or add manually below
            </Text>
          </View>
        )}

        {/* Or paste a link */}
        <View style={s.orDivider}>
          <View style={s.orLine} />
          <Text style={s.orText}>or paste a link</Text>
          <View style={s.orLine} />
        </View>

        <View style={s.linkBar}>
          <Feather name="link" size={14} color={colors.sand} />
          <TextInput
            style={s.linkInput}
            placeholder="pinterest, google maps, instagram..."
            placeholderTextColor={colors.sand}
            value={pastedUrl}
            onChangeText={handlePasteLink}
            autoCapitalize="none"
          />
          {linkParsed && (
            <View style={s.foundBadge}>
              <Feather name="check" size={10} color={colors.teal} />
              <Text style={s.foundText}>found</Text>
            </View>
          )}
        </View>

        {/* Selected place detail / manual entry */}
        {selectedPlace && (
          <View style={s.detailCard}>
            <View style={s.detailPhoto}>
              <Feather name="image" size={20} color={colors.sand} />
            </View>
            <Text style={s.detailName}>{placeName}</Text>
            <Text variant="caption" style={s.detailAddr}>{placeLocation}</Text>

            <View style={s.detailBadges}>
              {CATEGORIES.find((c) => c.id === placeCategory) && (
                <View style={[s.detailBadge, { backgroundColor: (CATEGORIES.find((c) => c.id === placeCategory)?.color ?? colors.stone) + "14" }]}>
                  <Feather
                    name={(CATEGORIES.find((c) => c.id === placeCategory)?.icon ?? "map-pin") as any}
                    size={9}
                    color={CATEGORIES.find((c) => c.id === placeCategory)?.color ?? colors.stone}
                  />
                  <Text style={[s.detailBadgeText, { color: CATEGORIES.find((c) => c.id === placeCategory)?.color }]}>
                    {placeCategory}
                  </Text>
                </View>
              )}
              {selectedPlace.rating > 0 && (
                <View style={[s.detailBadge, { backgroundColor: colors.gold + "14" }]}>
                  <Text style={[s.detailBadgeText, { color: colors.gold }]}>★ {selectedPlace.rating}</Text>
                </View>
              )}
              <View style={[s.detailBadge, { backgroundColor: colors.stone + "14" }]}>
                <Text style={[s.detailBadgeText, { color: colors.stone }]}>{selectedPlace.priceLevel}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Time picker */}
        {(selectedPlace || linkParsed) && (
          <View style={s.timeSection}>
            <Text variant="eyebrow" style={s.fieldLabel}>time</Text>
            <View style={s.timeRow}>
              <View style={s.timeCard}>
                <Text variant="caption" style={s.timeCardLabel}>start</Text>
                <TextInput
                  style={s.timeInput}
                  placeholder="10:00 AM"
                  placeholderTextColor={colors.sand}
                  value={placeTime}
                  onChangeText={setPlaceTime}
                />
              </View>
              <View style={s.timeCard}>
                <Text variant="caption" style={s.timeCardLabel}>end</Text>
                <TextInput
                  style={s.timeInput}
                  placeholder="11:30 AM"
                  placeholderTextColor={colors.sand}
                  value={placeEndTime}
                  onChangeText={setPlaceEndTime}
                />
              </View>
            </View>
          </View>
        )}

        {/* Manual name if no selection */}
        {!selectedPlace && !linkParsed && (
          <>
            <View style={s.orDivider}>
              <View style={s.orLine} />
              <Text style={s.orText}>or enter manually</Text>
              <View style={s.orLine} />
            </View>
            <TextInput
              style={s.manualName}
              placeholder="place name"
              placeholderTextColor={colors.sand}
              value={placeName}
              onChangeText={setPlaceName}
            />
            <TextInput
              style={s.manualField}
              placeholder="location (neighbourhood, city)"
              placeholderTextColor={colors.sand}
              value={placeLocation}
              onChangeText={setPlaceLocation}
            />
          </>
        )}

        {/* Notes */}
        {showDetails && (
          <View style={s.notesSection}>
            <Text variant="eyebrow" style={s.fieldLabel}>notes</Text>
            <TextInput
              style={s.notesInput}
              placeholder="add a note about this place..."
              placeholderTextColor={colors.sand}
              value={placeNotes}
              onChangeText={setPlaceNotes}
              multiline
            />
          </View>
        )}

        {/* Day picker */}
        <Text variant="eyebrow" style={[s.fieldLabel, { marginTop: spacing.lg }]}>add to</Text>
        <View style={s.dayList}>
          {days.map((d) => {
            const isSelected = selectedDayId === d.id;
            return (
              <Pressable
                key={d.id}
                style={({ pressed }) => [
                  s.dayRow,
                  isSelected && s.dayRowActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setSelectedDayId(d.id)}
              >
                <View style={[s.dayRadio, isSelected && s.dayRadioActive]}>
                  {isSelected && <View style={s.dayRadioInner} />}
                </View>
                <View style={s.dayInfo}>
                  <Text style={[s.dayLabel, isSelected && s.dayLabelActive]}>
                    day {d.dayNumber}
                  </Text>
                  <Text variant="caption" style={s.dayMeta}>
                    {formatDayDate(d.date)} · {d.itemCount} {d.itemCount === 1 ? "place" : "places"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Save button */}
        <View style={s.bottomActions}>
          <TouchableOpacity
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!canSave || createItem.isPending}
          >
            {createItem.isPending ? (
              <ActivityIndicator color={colors.pearl} size="small" />
            ) : (
              <>
                <Feather name="check" size={14} color={colors.pearl} />
                <Text style={s.saveBtnText}>
                  {selectedDayId ? `add to day ${days.find((d) => d.id === selectedDayId)?.dayNumber ?? ""}` : "select a day"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: 14,
  },
  scroll: { paddingBottom: 40 },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.mist,
    padding: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 15,
    color: colors.ink,
  },

  /* Category chips */
  catRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 12,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.mist,
    backgroundColor: colors.pearl,
  },
  catChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: colors.stone,
  },

  /* Results */
  resultsCard: {
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.mist,
    overflow: "hidden",
  },
  resultDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mist,
    marginLeft: 52,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
  },
  resultAddr: { fontSize: 10, color: colors.stone, marginTop: 1 },
  resultMeta: { fontSize: 9, color: colors.stone, marginTop: 2 },
  addBtnSm: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  noResults: {
    padding: 16,
    alignItems: "center",
  },
  noResultsText: { color: colors.stone, textAlign: "center" },

  /* Or divider */
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mist,
  },
  orText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  /* Link bar */
  linkBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.mist,
    padding: 12,
  },
  linkInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.ink,
  },
  foundBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.teal + "14",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  foundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: colors.teal,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Detail card (selected place) */
  detailCard: {
    backgroundColor: colors.pearl,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.mist,
    overflow: "hidden",
    marginTop: 16,
  },
  detailPhoto: {
    height: 120,
    backgroundColor: colors.gold + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  detailName: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  detailAddr: {
    fontSize: 11,
    color: colors.stone,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  detailBadges: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexWrap: "wrap",
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  detailBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },

  /* Time */
  timeSection: { marginTop: 16 },
  fieldLabel: { marginBottom: 8 },
  timeRow: { flexDirection: "row", gap: 10 },
  timeCard: {
    flex: 1,
    backgroundColor: colors.pearl,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.mist,
    padding: 10,
  },
  timeCardLabel: { fontSize: 9, color: colors.stone, marginBottom: 4 },
  timeInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.ink,
  },

  /* Manual entry */
  manualName: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 22,
    color: colors.ink,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
  },
  manualField: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.ink,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
    marginTop: 4,
  },

  /* Notes */
  notesSection: { marginTop: 16 },
  notesInput: {
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.mist,
    padding: 12,
    minHeight: 60,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
    textAlignVertical: "top",
  },

  /* Day picker */
  dayList: { gap: 6 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.pearl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.mist,
    padding: 12,
  },
  dayRowActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coral + "06",
  },
  dayRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  dayRadioActive: { borderColor: colors.coral },
  dayRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
  dayInfo: { flex: 1, gap: 1 },
  dayLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
  },
  dayLabelActive: { color: colors.coral },
  dayMeta: { fontSize: 10, color: colors.stone },

  /* Bottom */
  bottomActions: { marginTop: spacing.lg },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 15,
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
    letterSpacing: 0.3,
  },
});
