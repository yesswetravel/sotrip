import { useMemo, useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { useTripMembers } from "../../../features/couple/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

const SCREEN_W = Dimensions.get("window").width;
const DAY_CARD_W = 66;
const ROLLER_ITEM_W = 56;
const ROLLER_PAD_H = (SCREEN_W - ROLLER_ITEM_W) / 2;

/* ------------------------------------------------------------------ */
/*  Category helpers                                                    */
/* ------------------------------------------------------------------ */

function getTimeOfDay(time: string | null): "morning" | "afternoon" | "evening" {
  if (!time) return "morning";
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatTime12(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

/* ------------------------------------------------------------------ */
/*  Day Card component                                                  */
/* ------------------------------------------------------------------ */

function DayCard({
  dayNumber,
  date,
  items,
  isActive,
  onPress,
  colors,
}: {
  dayNumber: number;
  date: string;
  items: TripItem[];
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    food: colors.coral,
    culture: colors.teal,
    nature: colors.gold,
    shopping: "#8B7BB5",
    nightlife: colors.ink,
    transport: colors.stone,
  };

  function getCategoryColor(cat: string | null): string {
    if (!cat) return colors.stone;
    return CATEGORY_COLORS[cat.toLowerCase()] ?? colors.stone;
  }

  const d = new Date(date + "T00:00:00");
  const dateNum = d.getDate();
  const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];

  const categoryDots = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((item) => {
      if (item.category) seen.add(item.category.toLowerCase());
    });
    return Array.from(seen).slice(0, 4);
  }, [items]);

  return (
    <TouchableOpacity
      style={[
        styles.dayCard,
        { borderColor: colors.mist, backgroundColor: colors.pearl },
        isActive && { backgroundColor: colors.ink, borderColor: colors.ink },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        variant="caption"
        style={[styles.dayLabel, { color: colors.stone }, isActive && { color: colors.sand }]}
      >
        day {dayNumber}
      </Text>
      <Text style={[styles.dayNumber, { color: colors.ink }, isActive && { color: colors.pearl }]}>
        {dateNum}
      </Text>
      <View style={styles.dayDots}>
        {categoryDots.map((cat, i) => (
          <View
            key={i}
            style={[
              styles.dayDot,
              {
                backgroundColor: isActive && cat === "nightlife"
                  ? colors.pearl
                  : getCategoryColor(cat),
              },
            ]}
          />
        ))}
      </View>
      <Text
        style={[styles.dayWeekday, { color: colors.stone }, isActive && { color: "rgba(255,255,255,0.5)" }]}
      >
        {weekday}
      </Text>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline Item component                                             */
/* ------------------------------------------------------------------ */

function TimelineItem({
  item,
  isLast,
  members,
  colors,
}: {
  item: TripItem;
  isLast: boolean;
  members: { display_name: string; avatar_color: string }[];
  colors: ReturnType<typeof useColors>;
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    food: colors.coral,
    culture: colors.teal,
    nature: colors.gold,
    shopping: "#8B7BB5",
    nightlife: colors.ink,
    transport: colors.stone,
  };
  const catColor = CATEGORY_COLORS[item.category?.toLowerCase() ?? ""] ?? colors.stone;

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineTrack}>
        <View style={[styles.timelineDot, { backgroundColor: catColor }]} />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.mist }]} />}
      </View>
      <View style={[styles.activityCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
        {item.time && (
          <Text style={[styles.activityTime, { color: colors.stone }]}>{formatTime12(item.time)}</Text>
        )}
        <Text style={[styles.activityTitle, { color: colors.ink }]}>{item.title}</Text>
        {item.location_name && (
          <Text style={[styles.activityLocation, { color: colors.stone }]}>{item.location_name}</Text>
        )}
        {members.length > 0 && (
          <View style={styles.activityPeople}>
            {members.slice(0, 4).map((m, i) => (
              <View
                key={i}
                style={[
                  styles.activityAvatar,
                  { backgroundColor: m.avatar_color, marginLeft: i > 0 ? -4 : 0 },
                ]}
              >
                <Text style={styles.activityAvatarText}>
                  {m.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            <Text style={[styles.activityPeopleLabel, { color: colors.stone }]}>
              {members.length === 1
                ? members[0].display_name
                : `${members.length} going`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Time Section component                                              */
/* ------------------------------------------------------------------ */

function TimeSection({
  label,
  items,
  allMembers,
  colors,
}: {
  label: string;
  items: TripItem[];
  allMembers: { id: string; display_name: string; avatar_color: string }[];
  colors: ReturnType<typeof useColors>;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.timeSection}>
      <Text style={[styles.timeSectionLabel, { color: colors.stone }]}>{label}</Text>
      {items.map((item, index) => {
        const tagged = (item.assigned_to ?? [])
          .map((mid) => allMembers.find((m) => m.id === mid))
          .filter(Boolean) as { display_name: string; avatar_color: string }[];
        return (
          <TimelineItem
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            members={tagged}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal Date Roller                                              */
/* ------------------------------------------------------------------ */

function DateRoller({
  days,
  selectedIndex,
  onSelect,
  colors,
}: {
  days: { dayNumber: number; date: string }[];
  selectedIndex: number;
  onSelect: (dayNumber: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const didMount = useRef(false);

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
      <TouchableOpacity activeOpacity={0.8} onPress={() => onSelect(item.dayNumber)}>
        <Animated.View
          style={[styles.rollerItem, { transform: [{ scale }], opacity }]}
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
        contentContainerStyle={{ paddingHorizontal: ROLLER_PAD_H }}
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

/* ------------------------------------------------------------------ */
/*  Main Screen                                                         */
/* ------------------------------------------------------------------ */

export default function CalendarTimelineScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);
  const { members } = useTripMembers(id);

  const [selectedDay, setSelectedDay] = useState(1);

  // Find selected day data
  const selectedDayData = useMemo(() => {
    if (!trip) return null;
    return trip.trip_days.find((d) => d.day_number === selectedDay) ?? null;
  }, [trip, selectedDay]);

  // Group items by time of day
  const grouped = useMemo(() => {
    if (!selectedDayData) return { morning: [], afternoon: [], evening: [] };
    const items = [...selectedDayData.trip_items].sort((a, b) =>
      (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
    );
    return {
      morning: items.filter((i) => getTimeOfDay(i.time) === "morning"),
      afternoon: items.filter((i) => getTimeOfDay(i.time) === "afternoon"),
      evening: items.filter((i) => getTimeOfDay(i.time) === "evening"),
    };
  }, [selectedDayData]);

  const totalItems = selectedDayData?.trip_items.length ?? 0;

  const allMembers = useMemo(
    () => [
      { id: "owner", display_name: "you", avatar_color: colors.coral },
      ...members.map((m) => ({
        id: m.id,
        display_name: m.display_name,
        avatar_color: m.avatar_color,
      })),
    ],
    [members]
  );

  // Format date for hero
  const heroDate = useMemo(() => {
    if (!selectedDayData?.date) return "";
    const d = new Date(selectedDayData.date + "T00:00:00");
    const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][d.getDay()];
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][d.getMonth()];
    return `${weekday}, ${month} ${d.getDate()}`;
  }, [selectedDayData]);

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return "";
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const s = new Date(start + "T00:00:00").toLocaleDateString("en-US", opts).toLowerCase();
    const e = new Date(end + "T00:00:00").toLocaleDateString("en-US", opts).toLowerCase();
    return `${s} — ${e}`;
  };

  if (!trip) return null;

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">trip calendar</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <Text style={[styles.tripName, { color: colors.ink }]}>{trip.title}</Text>
          <Text style={[styles.tripDates, { color: colors.stone }]}>
            {formatDateRange(trip.start_date, trip.end_date)}
          </Text>
        </View>

        {/* Shared With */}
        <View style={styles.sharedBar}>
          <Text style={[styles.sharedLabel, { color: colors.stone }]}>shared with</Text>
          <View style={styles.avatarStack}>
            {allMembers.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.sharedAvatar,
                  { backgroundColor: m.avatar_color, marginLeft: i > 0 ? -6 : 0, borderColor: colors.ivory },
                ]}
              >
                <Text style={styles.sharedAvatarText}>
                  {m.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Date Roller */}
        <DateRoller
          days={trip.trip_days.map((d) => ({
            dayNumber: d.day_number,
            date: d.date ?? "",
          }))}
          selectedIndex={selectedDay - 1}
          onSelect={setSelectedDay}
          colors={colors}
        />

        {/* Day Hero Card */}
        <View style={[styles.dayHero, { backgroundColor: colors.ink }]}>
          <View style={styles.dayHeroOverlay}>
            <Text style={[styles.dayHeroTitle, { color: colors.pearl }]}>
              day {selectedDay}
              {selectedDayData?.title ? ` — ${selectedDayData.title}` : ""}
            </Text>
            <Text style={styles.dayHeroDate}>{heroDate}</Text>
          </View>
          <View style={styles.dayHeroBadge}>
            <Text style={styles.dayHeroBadgeText}>
              {totalItems} {totalItems === 1 ? "activity" : "activities"}
            </Text>
          </View>
        </View>

        {/* Day Notes */}
        {selectedDayData?.notes && (
          <View style={[styles.dayNote, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "25" }]}>
            <Feather name="bookmark" size={14} color={colors.gold} />
            <Text style={[styles.dayNoteText, { color: colors.stone }]}>{selectedDayData.notes}</Text>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timeline}>
          <TimeSection label="morning" items={grouped.morning} allMembers={allMembers} colors={colors} />
          <TimeSection label="afternoon" items={grouped.afternoon} allMembers={allMembers} colors={colors} />
          <TimeSection label="evening" items={grouped.evening} allMembers={allMembers} colors={colors} />
        </View>

        {/* Empty state */}
        {totalItems === 0 && (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={24} color={colors.sand} />
            <Text style={[styles.emptyText, { color: colors.stone }]}>no activities planned yet</Text>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.coral }]}
              onPress={() => router.push(`/trip/${id}/day/${selectedDay}`)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={14} color={colors.pearl} />
              <Text style={[styles.addBtnText, { color: colors.pearl }]}>add activities</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: 14,
  },

  /* Trip info */
  tripInfo: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  tripName: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 26,
  },
  tripDates: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.3,
    fontFamily: "Inter_400Regular",
  },

  /* Shared bar */
  sharedBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: spacing.md,
  },
  sharedLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "Inter_600SemiBold",
  },
  avatarStack: {
    flexDirection: "row",
  },
  sharedAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  sharedAvatarText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
  },

  /* Day strip */
  dayStrip: {
    paddingHorizontal: spacing.lg,
    gap: 10,
    paddingBottom: spacing.md,
  },
  dayCard: {
    width: DAY_CARD_W,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  dayLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_600SemiBold",
  },
  dayNumber: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 24,
    marginVertical: 1,
  },
  dayDots: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
    marginBottom: 3,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dayWeekday: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Inter_400Regular",
  },

  /* Day hero */
  dayHero: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    overflow: "hidden",
    height: 100,
    justifyContent: "flex-end",
    marginBottom: spacing.md,
  },
  dayHeroOverlay: {
    padding: 14,
    paddingTop: 20,
  },
  dayHeroTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 20,
  },
  dayHeroDate: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
    fontFamily: "Inter_400Regular",
  },
  dayHeroBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dayHeroBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.4,
  },

  /* Day note */
  dayNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  dayNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    fontFamily: "Inter_400Regular",
  },

  /* Timeline */
  timeline: {
    paddingHorizontal: spacing.lg,
  },
  timeSection: {
    marginBottom: spacing.lg,
  },
  timeSectionLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Inter_600SemiBold",
    paddingLeft: 28,
    marginBottom: 12,
  },

  /* Timeline item */
  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timelineTrack: {
    width: 20,
    alignItems: "center",
    flexShrink: 0,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 16,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    marginTop: 4,
  },

  /* Activity card */
  activityCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    marginLeft: 10,
  },
  activityTime: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activityTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  /* Activity people */
  activityPeople: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  activityAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityAvatarText: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  activityPeopleLabel: {
    fontSize: 9,
    marginLeft: 6,
    fontFamily: "Inter_400Regular",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  /* Date roller */
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
});
