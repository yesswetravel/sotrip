import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { Skeleton } from "../../../features/shared";
import { useTrip, useTripRealtime } from "../../../features/trips/hooks";
import { useTheme } from "../../../features/theme/ThemeProvider";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";
import { MOTION } from "../../../theme/motion";
import type { TripItem } from "../../../types/database";

const SCREEN_W = Dimensions.get("window").width;

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(start + "T00:00:00").toLocaleDateString("en-US", opts).toLowerCase();
  const e = new Date(end + "T00:00:00").toLocaleDateString("en-US", opts).toLowerCase();
  return `${s} — ${e}`;
}

function daysUntilLabel(dateStr: string | null): string {
  if (!dateStr) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "trip completed";
  if (diff === 0) return "your trip is today";
  if (diff === 1) return "your trip is tomorrow";
  return `${diff} days until your trip`;
}

/* ------------------------------------------------------------------ */
/*  Cairn Navigation Hub                                                */
/* ------------------------------------------------------------------ */

/* Flipped cairn: largest on top (timeline) → smallest at bottom (team) */
const DOT_SIZES = [109, 62, 39, 31];
const DOT_ICON_SIZES = [44, 26, 17, 0];
const DOT_ICONS: (keyof typeof Feather.glyphMap)[] = ["calendar", "map", "folder", "users"];
const DOT_GAPS = [0, 16, 10, 5];
const LABEL_SIZES = [10, 10, 9, 8];
const LABEL_SPACING = [2, 2, 1.5, 1.2];

function CairnHub({
  tripId,
  onNavigate,
  firstDayNumber = 1,
}: {
  tripId: string;
  onNavigate: (target: string) => void;
  firstDayNumber?: number;
}) {
  const { theme } = useTheme();
  const colors = useColors();

  const dotColors = [
    theme.ink,
    theme.ink,
    theme.accent,
    theme.accent,
  ];

  const iconColors = [
    theme.pearl,
    theme.pearl,
    theme.pearl,
    theme.accent,
  ];

  const labels = ["timeline", "map", "folder", "team"];
  const targets = [`day/${firstDayNumber}`, "map", "folder", "invite"];

  const dots = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  useEffect(() => {
    dots.forEach((dot, i) => {
      dot.value = withDelay(
        i * 100,
        withTiming(1, {
          duration: MOTION?.cairnRise ?? 400,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
    });
  }, []);

  const makeDotStyle = (v: { value: number }) =>
    useAnimatedStyle(() => ({
      opacity: v.value,
      transform: [{ translateY: (1 - v.value) * 12 }],
    }));

  return (
    <View style={styles.cairnHub}>
      {dots.map((dv, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.cairnItem, { marginTop: DOT_GAPS[i] }]}
          onPress={() => onNavigate(targets[i])}
          activeOpacity={0.75}
        >
          <Animated.View
            style={[
              {
                width: DOT_SIZES[i],
                height: DOT_SIZES[i],
                borderRadius: DOT_SIZES[i] / 2,
                backgroundColor: dotColors[i],
                alignItems: "center",
                justifyContent: "center",
              },
              makeDotStyle(dv),
            ]}
          >
            {DOT_ICON_SIZES[i] > 0 && (
              <View style={{ opacity: 0.2 }}>
                <Feather
                  name={DOT_ICONS[i]}
                  size={DOT_ICON_SIZES[i]}
                  color={iconColors[i]}
                />
              </View>
            )}
          </Animated.View>
          <Animated.Text
            style={[
              styles.cairnLabel,
              {
                color: colors.stone,
                fontSize: LABEL_SIZES[i],
                letterSpacing: LABEL_SPACING[i],
              },
              makeDotStyle(dv),
            ]}
          >
            {labels[i]}
          </Animated.Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Month Calendar (read-only)                                          */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function MonthCalendar({
  startDate,
  endDate,
  tripDays,
  onDayPress,
  colors,
}: {
  startDate: string;
  endDate: string;
  tripDays: { day_number: number; date: string | null; trip_items: TripItem[] }[];
  onDayPress: (dayNumber: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const tripDateMap = useMemo(() => {
    const map = new Map<string, { dayNumber: number; itemCount: number }>();
    tripDays.forEach((d) => {
      if (d.date) map.set(d.date, { dayNumber: d.day_number, itemCount: d.trip_items.length });
    });
    return map;
  }, [tripDays]);

  /* Determine which months the trip spans */
  const startRef = new Date(startDate + "T00:00:00");
  const endRef = new Date(endDate + "T00:00:00");
  const startYM = startRef.getFullYear() * 12 + startRef.getMonth();
  const endYM = endRef.getFullYear() * 12 + endRef.getMonth();
  const spansMultiple = endYM > startYM;

  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date(startRef.getFullYear(), startRef.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toLowerCase();

  const canGoBack = monthOffset > 0;
  const canGoForward = (year * 12 + month) < endYM;

  const firstOfMonth = new Date(year, month, 1);
  let startDow = firstOfMonth.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  const lastRow = rows[rows.length - 1];
  while (lastRow.length < 7) lastRow.push(null);

  return (
    <View style={[styles.monthWrap, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
      <View style={styles.monthHeader}>
        {spansMultiple && canGoBack ? (
          <TouchableOpacity onPress={() => setMonthOffset((o) => o - 1)} activeOpacity={0.7} style={styles.monthArrow}>
            <Feather name="chevron-left" size={18} color={colors.taupe} />
          </TouchableOpacity>
        ) : (
          <View style={styles.monthArrow} />
        )}
        <Text style={[styles.monthTitle, { color: colors.ink, marginBottom: 0 }]}>{monthName}</Text>
        {spansMultiple && canGoForward ? (
          <TouchableOpacity onPress={() => setMonthOffset((o) => o + 1)} activeOpacity={0.7} style={styles.monthArrow}>
            <Feather name="chevron-right" size={18} color={colors.taupe} />
          </TouchableOpacity>
        ) : (
          <View style={styles.monthArrow} />
        )}
      </View>

      <View style={styles.monthRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.monthCell}>
            <Text style={[styles.monthWeekday, { color: colors.sand }]}>{d}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.monthRow}>
          {row.map((dayNum, ci) => {
            if (dayNum === null) return <View key={ci} style={styles.monthCell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const tripDay = tripDateMap.get(dateStr);
            const isTrip = !!tripDay;
            const isToday = dateStr === todayStr;
            const isStart = dateStr === startDate;
            const isEnd = dateStr === endDate;

            return (
              <TouchableOpacity
                key={ci}
                style={[
                  styles.monthCell,
                  isTrip && [styles.monthCellTrip, { backgroundColor: colors.ink + "0F" }],
                  isStart && styles.monthCellStart,
                  isEnd && styles.monthCellEnd,
                ]}
                activeOpacity={isTrip ? 0.7 : 1}
                onPress={() => isTrip && onDayPress(tripDay!.dayNumber)}
                disabled={!isTrip}
              >
                <Text
                  style={[
                    styles.monthDayNum,
                    { color: colors.ink },
                    isTrip && [styles.monthDayNumTrip, { color: colors.ink }],
                    isToday && { color: colors.coral },
                    !isTrip && { color: colors.sand },
                  ]}
                >
                  {dayNum}
                </Text>
                {isTrip && tripDay!.itemCount > 0 && (
                  <View style={[styles.monthDot, { backgroundColor: colors.coral }]} />
                )}
                {isToday && !isTrip && (
                  <View style={[styles.monthDot, { backgroundColor: colors.coral, opacity: 0.4 }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function TripOverviewScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading, isError, refetch } = useTrip(id);
  useTripRealtime(id);

  const totalItems = useMemo(
    () => trip?.trip_days.reduce((sum, d) => sum + d.trip_items.length, 0) ?? 0,
    [trip]
  );

  if (isLoading) {
    return (
      <Container logo>
        <View style={{ paddingTop: 80, paddingHorizontal: spacing.lg }}>
          <Skeleton width="60%" height={28} />
          <View style={{ height: 8 }} />
          <Skeleton width="40%" height={14} />
        </View>
      </Container>
    );
  }

  if (isError || !trip) {
    return (
      <Container logo>
        <View style={{ alignItems: "center", paddingTop: 80, gap: 12 }}>
          <Feather name="alert-circle" size={28} color={colors.stone} />
          <Text variant="body" style={{ color: colors.stone }}>couldn't load trip</Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8} style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text variant="body" style={{ color: colors.coral }}>try again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.8}>
            <Text variant="caption" style={{ color: colors.stone }}>go back</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  function handleNavigate(target: string) {
    router.push(`/trip/${id}/${target}`);
  }

  return (
    <Container safe={false} logo>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ============ Header ============ */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="eyebrow">trip overview</Text>
          <TouchableOpacity
            onPress={() => router.push(`/trip/${id}/share`)}
            activeOpacity={0.7}
          >
            <Feather name="share" size={18} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <Text variant="display" style={[styles.tripTitle, { color: colors.ink }]}>
            {trip.title}
          </Text>
          {trip.destination ? (
            <Text variant="subtitle" style={{ color: colors.stone, marginBottom: 2 }}>
              {trip.destination}
            </Text>
          ) : null}
          <Text variant="eyebrow" style={{ color: colors.stone }}>
            {formatDateRange(trip.start_date, trip.end_date)}
          </Text>
          <Text variant="caption" style={[styles.countdown, { color: colors.taupe }]}>
            {daysUntilLabel(trip.start_date)}
            {totalItems > 0 ? ` · ${totalItems} places` : ""}
          </Text>
        </View>

        {/* ============ Cairn Navigation Hub ============ */}
        <CairnHub tripId={id} onNavigate={handleNavigate} firstDayNumber={trip.trip_days?.[0]?.day_number ?? 1} />

        {/* ============ Calendar ============ */}
        <View style={styles.calendarSection}>
          <View style={{ height: spacing.sm }} />
          <MonthCalendar
            startDate={trip.start_date ?? ""}
            endDate={trip.end_date ?? ""}
            tripDays={trip.trip_days}
            onDayPress={(dayNum) => router.push(`/trip/${id}/day/${dayNum}`)}
            colors={colors}
          />
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  titleBlock: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  tripTitle: {
    fontSize: 30,
    textAlign: "center",
  },
  countdown: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "InstrumentSans_400Regular",
  },

  /* Cairn Hub */
  cairnHub: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  cairnItem: {
    alignItems: "center",
    gap: 6,
  },
  cairnLabel: {
    fontFamily: "InstrumentSans_500Medium",
    textTransform: "uppercase",
  },

  /* Calendar section */
  calendarSection: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  /* Month calendar */
  monthWrap: {
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  monthArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: "row",
  },
  monthWeekday: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "InstrumentSans_600SemiBold",
    textAlign: "center",
    paddingBottom: 4,
  },
  monthCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  monthCellTrip: {},
  monthCellStart: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  monthCellEnd: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  monthDayNum: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 18,
  },
  monthDayNumTrip: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 18,
  },
  monthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
