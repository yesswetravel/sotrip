import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  Linking,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../../features/design-system";
import { goBack } from "../../../../lib/go-back";
import { getCategoryForItem } from "../../../../theme/categories";
import { useToast } from "../../../../features/shared/toast-context";
import ItemSheet from "../../../../features/trips/components/ItemSheet";
import ItemDetailSheet from "../../../../features/trips/components/ItemDetailSheet";
import {
  useTrip,
  useDeleteItem,
  useTripRealtime,
} from "../../../../features/trips/hooks";
import { useCanAddItem, useSubscription } from "../../../../features/subscription/hooks";
import UpgradeModal from "../../../../features/subscription/UpgradeModal";
import { useColors } from "../../../../features/theme/ThemeProvider";
import { spacing } from "../../../../theme/spacing";
import type { TripItem } from "../../../../types/database";

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
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=15&size=${size}x${size}&scale=2&maptype=roadmap&style=feature:all|saturation:-60|lightness:5&style=feature:water|color:0xc4d4d1&style=feature:landscape|color:0xece6d6&style=feature:road|element:geometry|color:0xded7c5&style=feature:poi|visibility:off&style=feature:transit|visibility:off&markers=color:0xD87560|${encoded}&key=${GMAP_KEY}`;
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
  const hasPhoto = !!item.photo_uri;
  const hasTitle = !!item.title?.trim();

  // Thumbnail: map for locations, photo only when no location
  const thumbUri = hasLocation && !mapError
    ? getStaticMapUrl(item.location_name!)
    : hasPhoto
      ? item.photo_uri!
      : null;

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

      {/* Right: content + thumbnail */}
      <View style={styles.contentColumn}>
        <View style={styles.contentRow}>
          <View style={styles.contentText}>
            {hasTitle ? (
              <Text variant="body" style={[styles.itemTitle, { color: colors.ink }]} numberOfLines={1}>
                {item.title}
              </Text>
            ) : (
              <Text variant="body" style={[styles.itemTitle, { color: colors.sand }]} numberOfLines={1}>
                {item.location_name || "untitled"}
              </Text>
            )}
            {item.subtitle && (
              <Text variant="caption" numberOfLines={1} style={[styles.itemSubtitle, { color: colors.stone }]}>
                {item.subtitle}
              </Text>
            )}
            {item.location_name && hasTitle && (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={10} color={colors.stone} />
                <Text variant="caption" style={[styles.itemLocation, { color: colors.stone }]}>
                  {item.location_name}
                </Text>
              </View>
            )}
          </View>

          {/* Thumbnail: photo or mini map */}
          {thumbUri ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (hasLocation) {
                  const dest = encodeURIComponent(item.location_name!);
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${dest}`);
                }
              }}
            >
              <Image
                source={{ uri: thumbUri }}
                style={[styles.mapThumb, { backgroundColor: colors.mist }]}
                contentFit="cover"
                transition={300}
                onError={() => { if (!hasPhoto) setMapError(true); }}
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
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTrip();
    setRefreshing(false);
  }, [refetchTrip]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TripItem | null>(null);
  const [viewingItem, setViewingItem] = useState<TripItem | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Outfits for this day
  const [dayOutfits, setDayOutfits] = useState<{ id: string; photoUri: string; name: string }[]>([]);
  const [fullScreenIndex, setFullScreenIndex] = useState<number | null>(null);
  const galleryRef = useRef<FlatList>(null);
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

  if (!trip || !currentDay) return <Container logo><ActivityIndicator size="small" style={{ marginTop: 40 }} /></Container>;

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">{trip.title}</Text>
        <View style={{ width: 20 }} />
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
        {items.length === 0 && dayOutfits.length === 0 ? (
          <View style={styles.emptyItems}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.teal + "14" }]}>
              <Feather name="compass" size={24} color={colors.teal} />
            </View>
            <Text variant="titleItalic" style={[styles.emptyText, { color: colors.stone }]}>
              nothing planned yet
            </Text>
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

        <View style={{ height: dayOutfits.length > 0 ? 170 : 100 }} />
      </ScrollView>

      {/* Sticky outfit strip at bottom */}
      {dayOutfits.length > 0 && (
        <View style={[styles.outfitStrip, { backgroundColor: colors.ivory, borderTopColor: colors.mist }]}>
          <View style={styles.outfitStripHeader}>
            <Feather name="scissors" size={10} color={colors.taupe} />
            <Text style={[styles.outfitStripLabel, { color: colors.taupe }]}>outfit</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.outfitStripScroll}
          >
            {dayOutfits.map((outfit) => (
              <TouchableOpacity
                key={outfit.id}
                style={[styles.outfitStripCard, { borderColor: colors.mist }]}
                onPress={() => setFullScreenIndex(dayOutfits.indexOf(outfit))}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: outfit.photoUri }}
                  style={styles.outfitStripThumb}
                  contentFit="cover"
                  transition={200}
                />
                {outfit.name ? (
                  <Text style={[styles.outfitStripName, { color: colors.ink }]} numberOfLines={1}>
                    {outfit.name}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          dayNumber={dayNumber}
          onOutfitsChanged={loadOutfits}
          onClose={() => {
            setSheetVisible(false);
            setEditingItem(null);
            loadOutfits();
          }}
        />
      )}

      <UpgradeModal
        visible={showUpgrade}
        limitMessage={`the free plan allows ${itemLimit} activities per trip. upgrade for unlimited planning.`}
        onClose={() => setShowUpgrade(false)}
      />

      {/* Fullscreen outfit gallery — swipeable */}
      <Modal
        visible={fullScreenIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenIndex(null)}
      >
        <View style={styles.galleryOverlay}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.galleryClose}
            onPress={() => setFullScreenIndex(null)}
            activeOpacity={0.8}
          >
            <Feather name="x" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Page indicator */}
          {dayOutfits.length > 1 && fullScreenIndex !== null && (
            <View style={styles.galleryCounter}>
              <Text style={styles.galleryCounterText}>
                {(fullScreenIndex ?? 0) + 1} / {dayOutfits.length}
              </Text>
            </View>
          )}

          {/* Swipeable photos */}
          <FlatList
            ref={galleryRef}
            data={dayOutfits}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            initialScrollIndex={fullScreenIndex ?? 0}
            style={styles.galleryList}
            getItemLayout={(_, index) => ({
              length: SCREEN_W,
              offset: SCREEN_W * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              setFullScreenIndex(idx);
            }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.gallerySlide}
                onPress={() => setFullScreenIndex(null)}
              >
                <Image
                  source={{ uri: item.photoUri }}
                  style={styles.galleryImage}
                  contentFit="contain"
                  transition={200}
                />
                {item.name ? (
                  <Text style={styles.galleryName}>{item.name}</Text>
                ) : null}
              </Pressable>
            )}
          />

          {/* Dot indicators */}
          {dayOutfits.length > 1 && (
            <View style={styles.galleryDots}>
              {dayOutfits.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.galleryDot,
                    i === (fullScreenIndex ?? 0) && styles.galleryDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
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
    fontFamily: "InstrumentSans_400Regular",
    marginTop: 6,
  },

  /* Date roller (horizontal) */
  rollerWrap: {
    height: 72,
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.lg,
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
    fontFamily: "InstrumentSans_500Medium",
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
    fontFamily: "InstrumentSans_500Medium",
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
    fontFamily: "InstrumentSans_500Medium",
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
    fontFamily: "InstrumentSans_500Medium",
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
    fontFamily: "InstrumentSans_600SemiBold",
  },
  nowMetaText: {
    fontSize: 11,
  },

  /* Sticky outfit strip */
  outfitStrip: {
    position: "absolute",
    bottom: 76,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 10,
  },
  outfitStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.lg,
    marginBottom: 6,
  },
  outfitStripLabel: {
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    fontFamily: "InstrumentSans_600SemiBold",
  },
  outfitStripScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  outfitStripCard: {
    width: 64,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  outfitStripThumb: {
    width: 64,
    height: 82,
  },
  outfitStripName: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontSize: 8,
    fontFamily: "InstrumentSans_500Medium",
  },

  /* Fullscreen outfit gallery */
  galleryOverlay: {
    flex: 1,
    backgroundColor: "rgba(30,42,58,0.7)",
    justifyContent: "center",
  },
  galleryClose: {
    position: "absolute",
    top: 54,
    right: 18,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryCounter: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  galleryCounterText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "InstrumentSans_500Medium",
    letterSpacing: 1,
  },
  galleryList: {
    flex: 1,
  },
  gallerySlide: {
    width: SCREEN_W,
    height: SCREEN_H - 140,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  galleryImage: {
    width: SCREEN_W - 32,
    height: SCREEN_H - 200,
    borderRadius: 6,
  },
  galleryName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: "InstrumentSans_500Medium",
    marginTop: 16,
    letterSpacing: 0.3,
  },
  galleryDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  galleryDotActive: {
    backgroundColor: "rgba(255,255,255,0.8)",
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* Add button area */
  addArea: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
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
    fontFamily: "InstrumentSans_500Medium",
  },
});
