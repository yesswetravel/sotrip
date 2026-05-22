import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Linking,
  Platform,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text, Card } from "../../../../features/design-system";
import { getCategoryForItem } from "../../../../theme/categories";
import { useToast } from "../../../../features/shared/toast-context";
import ItemSheet from "../../../../features/trips/components/ItemSheet";
import ItemDetailSheet from "../../../../features/trips/components/ItemDetailSheet";
import { UploadProgressBanner, PhotoGrid } from "../../../../features/photos/components";
import { usePhotosByDay } from "../../../../features/photos/hooks";
import { pickPhotos, uploadPhotos } from "../../../../features/photos/pipeline";
import {
  useTrip,
  useDeleteItem,
  useUpdateDayNotes,
  useTripRealtime,
} from "../../../../features/trips/hooks";
import { useCanAddItem, useSubscription } from "../../../../features/subscription/hooks";
import UpgradeModal from "../../../../features/subscription/UpgradeModal";
import { useColors } from "../../../../features/theme/ThemeProvider";
import { spacing } from "../../../../theme/spacing";
import type { TripItem } from "../../../../types/database";
import type { Photo, PhotoUploadJob } from "../../../../types/photos";

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

const GMAP_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";

function getStaticMapUrl(place: string, size = 120): string {
  const encoded = encodeURIComponent(place);
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=15&size=${size}x${size}&scale=2&maptype=roadmap&style=feature:all|saturation:-60|lightness:10&style=feature:poi|visibility:off&style=feature:transit|visibility:off&markers=color:0xD87560|${encoded}&key=${GMAP_KEY}`;
}

function TimelineItem({
  item,
  onTap,
  onDelete,
  isLast,
}: {
  item: TripItem;
  onTap: () => void;
  onDelete: () => void;
  isLast: boolean;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [mapError, setMapError] = useState(false);
  const colors = useColors();
  const cat = getCategoryForItem(item.category);
  const hasLocation = !!(item.location_name && GMAP_KEY);

  return (
    <Pressable
      style={({ pressed }) => [styles.timelineRow, pressed && { opacity: 0.7 }]}
      onPress={onTap}
      onLongPress={() => setShowDelete(!showDelete)}
      role="button"
      accessibilityRole="button"
    >
      {/* Left: time column */}
      <View style={styles.timeColumn}>
        {item.time ? (
          <Text variant="caption" style={[styles.timeText, { color: colors.taupe }]}>
            {formatTime12h(item.time)}
          </Text>
        ) : (
          <Text variant="caption" style={[styles.timeText, { color: colors.taupe }]}>—</Text>
        )}
      </View>

      {/* Center: dot + line */}
      <View style={styles.dotColumn}>
        <View style={[styles.dot, { backgroundColor: cat.color }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: colors.sand }]} />}
      </View>

      {/* Right: content + map */}
      <View style={styles.contentColumn}>
        <View style={styles.contentRow}>
          <View style={styles.contentText}>
            <Text variant="body" style={[styles.itemTitle, { color: colors.ink }]} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text variant="caption" numberOfLines={1} style={[styles.itemSubtitle, { color: colors.stone }]}>
                {item.subtitle}
              </Text>
            )}
            {item.location_name && (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={10} color={colors.stone} />
                <Text variant="caption" style={[styles.itemLocation, { color: colors.stone }]}>
                  {item.location_name}
                </Text>
              </View>
            )}
            {null}
          </View>

          {/* Mini map thumbnail — tap to open Google Maps */}
          {hasLocation && !mapError ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const dest = encodeURIComponent(item.location_name!);
                const url = `https://www.google.com/maps/search/?api=1&query=${dest}`;
                Linking.openURL(url);
              }}
            >
              <Image
                source={{ uri: getStaticMapUrl(item.location_name!) }}
                style={[styles.mapThumb, { backgroundColor: colors.mist }]}
                contentFit="cover"
                transition={300}
                onError={() => setMapError(true)}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {showDelete && (
          <TouchableOpacity
            style={styles.deleteLink}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={12} color="#C44" />
            <Text variant="caption" style={styles.deleteLinkText}>delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal Date Roller                                              */
/* ------------------------------------------------------------------ */

const ROLLER_ITEM_W = 56;
const SCREEN_W = Dimensions.get("window").width;
const ROLLER_PAD_H = (SCREEN_W - ROLLER_ITEM_W) / 2;

function DateRoller({
  days,
  selectedIndex,
  onSelect,
}: {
  days: { dayNumber: number; date: string }[];
  selectedIndex: number;
  onSelect: (dayNumber: number) => void;
}) {
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const didMount = useRef(false);
  const colors = useColors();

  useEffect(() => {
    if (flatRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatRef.current?.scrollToOffset({
          offset: selectedIndex * ROLLER_ITEM_W,
          animated: didMount.current,
        });
        didMount.current = true;
      }, 50);
    }
  }, [selectedIndex]);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / ROLLER_ITEM_W);
    const clamped = Math.max(0, Math.min(idx, days.length - 1));
    if (days[clamped]) onSelect(days[clamped].dayNumber);
  }

  function renderItem({ item, index }: { item: { dayNumber: number; date: string }; index: number }) {
    const d = new Date(item.date + "T00:00:00");
    const dateNum = d.getDate();
    const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];

    const inputRange = [
      (index - 2) * ROLLER_ITEM_W,
      (index - 1) * ROLLER_ITEM_W,
      index * ROLLER_ITEM_W,
      (index + 1) * ROLLER_ITEM_W,
      (index + 2) * ROLLER_ITEM_W,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 0.85, 1.15, 0.85, 0.7],
      extrapolate: "clamp",
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.25, 0.5, 1, 0.5, 0.25],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelect(item.dayNumber)}
      >
        <Animated.View
          style={[
            styles.rollerItem,
            { transform: [{ scale }], opacity },
          ]}
        >
          <Text style={[styles.rollerDateNum, { color: colors.ink }]}>{dateNum}</Text>
          <Text style={[styles.rollerWeekday, { color: colors.stone }]}>{weekday}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.rollerWrap}>
      <Animated.FlatList
        ref={flatRef}
        data={days}
        horizontal
        keyExtractor={(item) => String(item.dayNumber)}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ROLLER_ITEM_W}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: ROLLER_PAD_H,
        }}
        getItemLayout={(_, index) => ({
          length: ROLLER_ITEM_W,
          offset: ROLLER_ITEM_W * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumEnd}
      />
    </View>
  );
}

export default function DayViewScreen() {
  const { id, n } = useLocalSearchParams<{ id: string; n: string }>();
  const router = useRouter();
  const { show } = useToast();
  const colors = useColors();
  const initialDay = parseInt(n, 10);
  const [dayNumber, setDayNumber] = useState(initialDay);

  const { data: trip, refetch: refetchTrip } = useTrip(id);
  useTripRealtime(id);
  const deleteItemMutation = useDeleteItem(id);
  const updateNotesMutation = useUpdateDayNotes(id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTrip();
    setRefreshing(false);
  }, [refetchTrip]);

  const [uploadJobs, setUploadJobs] = useState<PhotoUploadJob[]>([]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TripItem | null>(null);
  const [viewingItem, setViewingItem] = useState<TripItem | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Outfit for this day
  const [dayOutfits, setDayOutfits] = useState<{ id: string; photoUri: string; name: string }[]>([]);
  const loadOutfits = useCallback(() => {
    AsyncStorage.getItem(`outfits_${id}`).then((raw) => {
      if (!raw) { setDayOutfits([]); return; }
      const all = JSON.parse(raw) as { id: string; photoUri: string; name: string; dayNumber: number | null }[];
      setDayOutfits(all.filter((o) => o.dayNumber === dayNumber));
    });
  }, [id, dayNumber]);
  useFocusEffect(loadOutfits);

  const currentDay = useMemo(
    () => trip?.trip_days.find((d) => d.day_number === dayNumber),
    [trip, dayNumber]
  );

  const { data: photos = [] } = usePhotosByDay(currentDay?.id);

  async function handleAddPhotos() {
    if (!trip || !currentDay) return;
    try {
      const uris = await pickPhotos();
      if (uris.length === 0) return;
      await uploadPhotos(uris, trip.id, currentDay.id, trip.owner_id, setUploadJobs);
      setTimeout(() => setUploadJobs([]), 3000);
    } catch (err) {
      show(err instanceof Error ? err.message : "couldn't add photos");
    }
  }

  function handlePhotoPress(photo: Photo) {
    router.push(`/trip/${id}/photo/${photo.id}`);
  }

  const items = useMemo(() => {
    if (!currentDay) return [];
    return [...currentDay.trip_items].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.sort_order - b.sort_order;
    });
  }, [currentDay]);

  // Subscription: total items across all days in trip
  const totalItemsInTrip = useMemo(
    () => trip?.trip_days.reduce((sum, d) => sum + d.trip_items.length, 0) ?? 0,
    [trip]
  );
  const { canAdd, limit: itemLimit } = useCanAddItem(totalItemsInTrip);
  const { isPaid } = useSubscription();

  // NOW card: find current or next item if today matches this day
  const isToday = currentDay?.date === new Date().toISOString().split("T")[0];
  const nowItem = useMemo(() => {
    if (!isToday || items.length === 0) return null;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    for (const item of items) {
      if (!item.time) continue;
      const [h, m] = item.time.split(":").map(Number);
      const itemMinutes = h * 60 + m;
      if (itemMinutes >= nowMinutes - 60) return item;
    }
    return items[0];
  }, [isToday, items]);

  // Shared notes thread (stored locally)
  const [noteThread, setNoteThread] = useState<
    { id: string; author: "self" | "partner"; text: string; time: string }[]
  >([]);
  const [newNoteText, setNewNoteText] = useState("");

  useEffect(() => {
    if (!currentDay) return;
    AsyncStorage.getItem(`thread_${id}_${dayNumber}`).then((raw) => {
      if (raw) setNoteThread(JSON.parse(raw));
    });
  }, [id, dayNumber, currentDay]);

  function addThreadNote() {
    if (!newNoteText.trim()) return;
    const next = [
      ...noteThread,
      {
        id: Date.now().toString(),
        author: "self" as const,
        text: newNoteText.trim(),
        time: new Date().toISOString(),
      },
    ];
    setNoteThread(next);
    setNewNoteText("");
    AsyncStorage.setItem(`thread_${id}_${dayNumber}`, JSON.stringify(next));
  }

  const calendarDays = useMemo(
    () =>
      trip?.trip_days.map((d) => ({
        dayNumber: d.day_number,
        date: d.date ?? "",
      })) ?? [],
    [trip]
  );

  const selectedDayIndex = useMemo(
    () => calendarDays.findIndex((d) => d.dayNumber === dayNumber),
    [calendarDays, dayNumber]
  );

  const [localNotes, setLocalNotes] = useState<string | null>(null);
  const notesValue = localNotes ?? currentDay?.notes ?? "";

  const handleNotesBlur = useCallback(() => {
    if (!currentDay || localNotes === null) return;
    updateNotesMutation.mutate(
      { dayId: currentDay.id, notes: localNotes },
      { onError: () => show("couldn't save notes") }
    );
    setLocalNotes(null);
  }, [currentDay, localNotes]);

  function handleDeleteItem(itemId: string) {
    deleteItemMutation.mutate(itemId, {
      onError: () => show("couldn't delete item"),
    });
  }

  function handleViewItem(item: TripItem) {
    setViewingItem(item);
  }

  function handleEditFromDetail() {
    const item = viewingItem;
    setViewingItem(null);
    setEditingItem(item);
    setSheetVisible(true);
  }

  function handleAddItem() {
    // TODO: re-enable limit check when Supabase is live
    // if (!canAdd) {
    //   setShowUpgrade(true);
    //   return;
    // }
    setEditingItem(null);
    setSheetVisible(true);
  }

  function formatDayDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      .toLowerCase();
  }

  if (!trip || !currentDay) return null;

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Feather name="chevron-left" size={16} color={colors.stone} />
          <Text variant="body" style={[styles.backLink, { color: colors.stone }]}>{trip.title}</Text>
        </TouchableOpacity>
      </View>

      {/* Date roller */}
      <DateRoller
        days={calendarDays}
        selectedIndex={selectedDayIndex}
        onSelect={(num) => setDayNumber(num)}
      />

      {/* Day info */}
      <View style={styles.dayInfo}>
        <Text variant="display" style={styles.dayTitle}>
          day {String(dayNumber).padStart(2, "0")}
        </Text>
        <Text variant="eyebrow" style={styles.dayDate}>
          {formatDayDate(currentDay.date)}
        </Text>
        <Text style={[styles.dayItemCount, { color: colors.stone }]}>
          {items.length} {items.length === 1 ? "activity" : "activities"}
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.stone}
            colors={[colors.coral]}
          />
        }
      >
        {/* NOW card */}
        {nowItem && isToday && (
          <TouchableOpacity
            style={[styles.nowCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
            onPress={() => router.push(`/trip/${id}/place/${nowItem.id}`)}
            activeOpacity={0.85}
          >
            <View style={[styles.nowHero, { backgroundColor: getCategoryForItem(nowItem.category).color }]}>
              <View style={[styles.nowChip, { backgroundColor: colors.coral }]}>
                <Animated.View style={[styles.nowDot, { backgroundColor: colors.pearl }]} />
                <Text style={[styles.nowChipText, { color: colors.pearl }]}>now</Text>
              </View>
            </View>
            <View style={styles.nowBody}>
              <Text variant="title" style={styles.nowTitle} numberOfLines={2}>
                {nowItem.title}
              </Text>
              {nowItem.subtitle && (
                <Text variant="caption" style={styles.nowSubtitle}>{nowItem.subtitle}</Text>
              )}
              <View style={[styles.nowMeta, { borderTopColor: colors.mist }]}>
                <View style={styles.nowAvatars}>
                  <View style={[styles.nowMiniAv, { backgroundColor: colors.coral, borderColor: colors.pearl }]}>
                    <Text style={[styles.nowMiniAvText, { color: colors.pearl }]}>P</Text>
                  </View>
                  <View style={[styles.nowMiniAv, { backgroundColor: colors.teal, borderColor: colors.pearl, marginLeft: -6 }]}>
                    <Text style={[styles.nowMiniAvText, { color: colors.pearl }]}>L</Text>
                  </View>
                </View>
                <Text variant="caption" style={[styles.nowMetaText, { color: colors.stone }]}>
                  {nowItem.location_name
                    ? `${nowItem.location_name} · `
                    : ""}
                  {nowItem.time ? formatTime12h(nowItem.time) : ""}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.teal + "14" }]}>
              <Feather name="compass" size={24} color={colors.teal} />
            </View>
            <Text variant="titleItalic" style={[styles.emptyText, { color: colors.stone }]}>
              nothing planned yet
            </Text>
            <Text variant="caption" style={[styles.emptyHint, { color: colors.taupe }]}>
              add places from search, links, or manually
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.teal }]}
              onPress={handleAddItem}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={14} color={colors.pearl} />
              <Text style={[styles.emptyAddText, { color: colors.pearl }]}>add a plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item, idx) => (
            <TimelineItem
              key={item.id}
              item={item}
              onTap={() => router.push(`/trip/${id}/place/${item.id}`)}
              onDelete={() => handleDeleteItem(item.id)}
              isLast={idx === items.length - 1}
            />
          ))
        )}

        {/* Day outfits — private to you */}
        <View style={styles.outfitSection}>
          <Pressable
            style={({ pressed }) => [styles.outfitHeader, pressed && { opacity: 0.5, backgroundColor: colors.mist }]}
            onPress={() => router.push(`/trip/${id}/day-look/${dayNumber}`)}
          >
            <View style={styles.outfitHeaderLeft}>
              <Feather name="camera" size={12} color={colors.taupe} />
              <Text variant="eyebrow" style={[styles.outfitLabel, { color: colors.taupe }]}>
                day {String(dayNumber).padStart(2, "0")} look
              </Text>
            </View>
            <View style={styles.outfitHeaderRight}>
              <View style={styles.outfitPrivacy}>
                <View style={[styles.outfitPrivacyDot, { backgroundColor: colors.coral }]} />
                <Text variant="caption" style={[styles.outfitPrivacyText, { color: colors.stone }]}>only you</Text>
              </View>
              <Feather name="chevron-right" size={14} color={colors.sand} />
            </View>
          </Pressable>

          {dayOutfits.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outfitScroll}
            >
              {dayOutfits.map((outfit) => (
                <TouchableOpacity
                  key={outfit.id}
                  style={[styles.outfitCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
                  onPress={() => router.push(`/trip/${id}/day-look/${dayNumber}`)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: outfit.photoUri }}
                    style={styles.outfitThumb}
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
            </ScrollView>
          ) : null}
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
            placeholder="notes for the day…"
            placeholderTextColor={colors.stone}
            value={notesValue}
            onChangeText={setLocalNotes}
            onBlur={handleNotesBlur}
            multiline
          />
        </View>

        {/* Photos */}
        <PhotoGrid
          photos={photos}
          onPhotoPress={handlePhotoPress}
          onAddPress={handleAddPhotos}
        />
        <View style={styles.memoryHint}>
          <Feather name="book-open" size={10} color={colors.sand} />
          <Text variant="caption" style={[styles.memoryHintText, { color: colors.sand }]}>
            included in your memory book
          </Text>
        </View>

        {/* Shared notes thread */}
        <View style={[styles.threadSection, { borderTopColor: colors.mist }]}>
          <View style={styles.threadHeader}>
            <Text variant="eyebrow">notes from today</Text>
            <View style={styles.threadPrivacy}>
              <View style={[styles.threadPrivacyDot, { backgroundColor: colors.coral }]} />
              <Text variant="caption" style={styles.threadPrivacyText}>
                only the two of you
              </Text>
            </View>
          </View>
          <View style={styles.memoryHint}>
            <Feather name="book-open" size={10} color={colors.sand} />
            <Text variant="caption" style={[styles.memoryHintText, { color: colors.sand }]}>
              these notes may appear in your memory book
            </Text>
          </View>

          {noteThread.map((note) => (
            <View key={note.id} style={styles.threadBubble}>
              <View
                style={[
                  styles.threadAvatar,
                  {
                    backgroundColor:
                      note.author === "self" ? colors.coral : colors.teal,
                  },
                ]}
              >
                <Text style={[styles.threadAvatarText, { color: colors.pearl }]}>
                  {note.author === "self" ? "P" : "L"}
                </Text>
              </View>
              <View style={styles.threadContent}>
                <Text style={[styles.threadText, { color: colors.ink }]}>{note.text}</Text>
                <Text variant="caption" style={styles.threadTime}>
                  {note.author === "self" ? "piggie" : "leo"} ·{" "}
                  {new Date(note.time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  }).toLowerCase()}
                </Text>
              </View>
            </View>
          ))}

          {/* Compose */}
          <View style={[styles.threadCompose, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
            <View style={[styles.threadAvatar, { backgroundColor: colors.coral }]}>
              <Text style={[styles.threadAvatarText, { color: colors.pearl }]}>P</Text>
            </View>
            <TextInput
              style={[styles.threadInput, { color: colors.ink }]}
              placeholder="something small worth remembering…"
              placeholderTextColor={colors.sand}
              value={newNoteText}
              onChangeText={setNewNoteText}
              onSubmitEditing={addThreadNote}
              returnKeyType="send"
            />
            {newNoteText.trim().length > 0 && (
              <TouchableOpacity onPress={addThreadNote} activeOpacity={0.7} hitSlop={8}>
                <Feather name="send" size={14} color={colors.coral} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload progress banner */}
      {uploadJobs.length > 0 && (
        <View style={styles.bannerWrap}>
          <UploadProgressBanner jobs={uploadJobs} />
        </View>
      )}

      {/* Add button */}
      <View style={styles.addArea}>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.ink }]} onPress={handleAddItem} activeOpacity={0.85}>
          <Feather name="plus" size={16} color={colors.ivory} style={{ marginRight: 6 }} />
          <Text variant="body" style={[styles.addButtonText, { color: colors.ivory }]}>add plan</Text>
        </TouchableOpacity>
      </View>

      {/* Item Detail Sheet (read-only) */}
      {viewingItem && (
        <ItemDetailSheet
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={handleEditFromDetail}
        />
      )}

      {/* Item Edit Sheet */}
      {sheetVisible && (
        <ItemSheet
          tripId={id}
          dayId={currentDay.id}
          item={editingItem}
          currentItemCount={totalItemsInTrip}
          onClose={() => {
            setSheetVisible(false);
            setEditingItem(null);
          }}
        />
      )}

      <UpgradeModal
        visible={showUpgrade}
        limitMessage={`the free plan allows ${itemLimit} activities per trip. upgrade for unlimited planning.`}
        onClose={() => setShowUpgrade(false)}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLink: {
    fontSize: 13,
  },
  dayInfo: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: 28,
  },
  dayDate: {
    marginTop: 2,
  },
  dayItemCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },

  /* Date roller (horizontal) */
  rollerWrap: {
    height: 72,
    marginBottom: spacing.sm,
  },
  rollerItem: {
    width: ROLLER_ITEM_W,
    alignItems: "center",
    justifyContent: "center",
    height: 64,
  },
  rollerDateNum: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 24,
    lineHeight: 28,
  },
  rollerWeekday: {
    fontSize: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  emptyItems: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 10,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyText: {},
  emptyHint: {
    textAlign: "center",
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: spacing.xs,
  },
  emptyAddText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 56,
    cursor: "pointer" as any,
  },
  timeColumn: {
    width: 64,
    alignItems: "flex-end",
    paddingRight: 14,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  dotColumn: {
    width: 16,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  line: {
    width: StyleSheet.hairlineWidth,
    flex: 1,
    marginTop: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 24,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contentText: {
    flex: 1,
  },
  mapThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  itemLocation: {
    fontSize: 11,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  itemLinkText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  deleteLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  deleteLinkText: {
    color: "#C44",
    fontSize: 11,
  },
  outfitSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  outfitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 6,
  },
  outfitHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  outfitLabel: {
    fontSize: 10,
  },
  outfitHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  outfitPrivacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  outfitPrivacyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  outfitPrivacyText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },
  outfitScroll: {
    gap: 8,
    paddingRight: spacing.lg,
  },
  outfitCard: {
    width: 72,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  outfitThumb: {
    width: 72,
    height: 92,
  },
  outfitName: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },
  notesSection: {
    marginTop: spacing.lg,
  },
  notesLabel: {
    marginBottom: spacing.sm,
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    minHeight: 80,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    textAlignVertical: "top",
  },
  /* Memory book hint */
  memoryHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
    marginBottom: 4,
  },
  memoryHintText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  /* NOW card */
  nowCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  nowHero: {
    height: 120,
    position: "relative",
    opacity: 0.85,
  },
  nowChip: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  nowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  nowChipText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 2,
    paddingRight: 2,
    textTransform: "uppercase",
  },
  nowBody: {
    padding: 16,
    paddingTop: 14,
  },
  nowTitle: {
    fontSize: 20,
    lineHeight: 24,
  },
  nowSubtitle: {
    marginTop: 6,
  },
  nowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nowAvatars: {
    flexDirection: "row",
  },
  nowMiniAv: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nowMiniAvText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
  },
  nowMetaText: {
    fontSize: 11,
  },

  /* Shared notes thread */
  threadSection: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  threadPrivacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  threadPrivacyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  threadPrivacyText: {
    fontSize: 10,
  },
  threadBubble: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  threadAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  threadAvatarText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  threadContent: {
    flex: 1,
  },
  threadText: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    lineHeight: 22,
  },
  threadTime: {
    fontSize: 10,
    marginTop: 3,
  },
  threadCompose: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  threadInput: {
    flex: 1,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    paddingVertical: 4,
  },

  /* Add button area with counter */
  addArea: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    gap: 6,
  },
  itemCounter: {
    fontSize: 10,
  },
  addButton: {
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  addButtonText: {
    fontFamily: "Inter_500Medium",
  },
  bannerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
