import { useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Container, Text, Card } from "../../../features/design-system";
import { Skeleton } from "../../../features/shared";
import { useTrip } from "../../../features/trips/hooks";
import { usePhotosByTrip } from "../../../features/photos/hooks";
import { useTripMembers } from "../../../features/couple/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

const PHOTO_TILE = (Dimensions.get("window").width - spacing.lg * 2 - 4) / 4;
const CELL_SIZE = Math.floor((Dimensions.get("window").width - spacing.lg * 2) / 7);

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "—";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "completed";
  if (diff === 0) return "today";
  return String(diff);
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(start + "T00:00:00")
    .toLocaleDateString("en-US", opts)
    .toLowerCase();
  const e = new Date(end + "T00:00:00")
    .toLocaleDateString("en-US", opts)
    .toLowerCase();
  return `${s} — ${e}`;
}

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

/* ------------------------------------------------------------------ */
/*  Month Calendar                                                      */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function MonthCalendar({
  startDate,
  endDate,
  tripDays,
  onDayPress,
}: {
  startDate: string;
  endDate: string;
  tripDays: { day_number: number; date: string | null; trip_items: TripItem[] }[];
  onDayPress: (dayNumber: number) => void;
}) {
  // Build a lookup: dateStr → { dayNumber, itemCount }
  const tripDateMap = useMemo(() => {
    const map = new Map<string, { dayNumber: number; itemCount: number }>();
    tripDays.forEach((d) => {
      if (d.date) map.set(d.date, { dayNumber: d.day_number, itemCount: d.trip_items.length });
    });
    return map;
  }, [tripDays]);

  // Determine the month to show (from start date)
  const refDate = new Date(startDate + "T00:00:00");
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const monthName = refDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase();

  // Build the grid: first day of month, padded to Monday start
  const firstOfMonth = new Date(year, month, 1);
  let startDow = firstOfMonth.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Today
  const todayStr = new Date().toISOString().split("T")[0];

  // Build cells: blanks + days
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Build rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  // Pad last row
  const lastRow = rows[rows.length - 1];
  while (lastRow.length < 7) lastRow.push(null);

  return (
    <View style={styles.monthWrap}>
      <Text style={styles.monthTitle}>{monthName}</Text>

      {/* Weekday header */}
      <View style={styles.monthRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.monthCell}>
            <Text style={styles.monthWeekday}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.monthRow}>
          {row.map((dayNum, ci) => {
            if (dayNum === null) {
              return <View key={ci} style={styles.monthCell} />;
            }
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
                  isTrip && styles.monthCellTrip,
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
                    isTrip && styles.monthDayNumTrip,
                    isToday && styles.monthDayNumToday,
                    !isTrip && styles.monthDayNumOff,
                  ]}
                >
                  {dayNum}
                </Text>
                {isTrip && tripDay!.itemCount > 0 && (
                  <View style={styles.monthDot} />
                )}
                {isToday && !isTrip && (
                  <View style={styles.monthTodayDot} />
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isLoading } = useTrip(id);
  const { data: allPhotos = [] } = usePhotosByTrip(id);
  const { members, pendingInvites } = useTripMembers(id);
  const recentPhotos = allPhotos.slice(0, 8);

  const totalItems = useMemo(
    () => trip?.trip_days.reduce((sum, d) => sum + d.trip_items.length, 0) ?? 0,
    [trip]
  );

  if (isLoading || !trip) {
    return (
      <Container>
        <Skeleton width="100%" height={200} borderRadius={0} />
        <View style={styles.statsRow}>
          <Skeleton width={100} height={60} />
          <Skeleton width={100} height={60} />
          <Skeleton width={100} height={60} />
        </View>
      </Container>
    );
  }

  return (
    <Container safe={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          {/* ============ Hero ============ */}
          <View style={styles.hero}>
            {allPhotos.length > 0 ? (
              <Image
                source={{ uri: allPhotos[0].display_url }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={400}
              />
            ) : (
              <View style={styles.heroPlaceholder} />
            )}
            <View style={styles.heroOverlay}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text variant="body" style={styles.backText}>←</Text>
              </TouchableOpacity>
              <View style={styles.heroText}>
                <Text variant="display" style={styles.heroTitle}>{trip.title}</Text>
                <Text variant="eyebrow" style={styles.heroDates}>
                  {formatDateRange(trip.start_date, trip.end_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* ============ Stats ============ */}
          <View style={styles.statsRow}>
            <StatCard label="days" value={String(trip.trip_days.length)} />
            <StatCard label="places" value={String(totalItems)} />
            <StatCard label="days until" value={daysUntil(trip.start_date)} />
          </View>

          {/* ============ Travel Mates ============ */}
          <View style={styles.section}>
            <View style={styles.matesHeader}>
              <Text variant="eyebrow" style={styles.sectionLabel}>travel mates</Text>
              <TouchableOpacity
                onPress={() => router.push(`/trip/${id}/invite`)}
                activeOpacity={0.7}
              >
                <Text variant="caption" style={styles.matesAdd}>+ invite</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.matesRow}
              onPress={() => router.push(`/trip/${id}/invite`)}
              activeOpacity={0.7}
            >
              <View style={[styles.mateCircle, { backgroundColor: colors.coral }]}>
                <Text style={styles.mateInitial}>P</Text>
              </View>
              {members.map((m) => (
                <View
                  key={m.id}
                  style={[styles.mateCircle, { backgroundColor: m.avatar_color, marginLeft: -8 }]}
                >
                  <Text style={styles.mateInitial}>
                    {m.display_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              {pendingInvites.map((inv) => (
                <View
                  key={inv.id}
                  style={[styles.mateCircle, styles.matePending, { marginLeft: -8 }]}
                >
                  <Feather name="clock" size={10} color={colors.stone} />
                </View>
              ))}
              {members.length === 0 && pendingInvites.length === 0 && (
                <View style={[styles.mateCircle, styles.mateAdd, { marginLeft: -8 }]}>
                  <Feather name="plus" size={12} color={colors.stone} />
                </View>
              )}
              <Text variant="caption" style={styles.matesLabel}>
                {members.length === 0 && pendingInvites.length === 0
                  ? "invite friends"
                  : `${members.length + 1} going${pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ""}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ============ Calendar ============ */}
          <View style={styles.section}>
            <Text variant="eyebrow" style={styles.sectionLabel}>calendar</Text>

            <MonthCalendar
              startDate={trip.start_date ?? ""}
              endDate={trip.end_date ?? ""}
              tripDays={trip.trip_days}
              onDayPress={(dayNum) => router.push(`/trip/${id}/day/${dayNum}`)}
            />

            {/* Full timeline link */}
            <TouchableOpacity
              style={styles.seeFullLink}
              onPress={() => router.push(`/trip/${id}/calendar`)}
              activeOpacity={0.7}
            >
              <Text style={styles.seeFullText}>see full timeline →</Text>
            </TouchableOpacity>
          </View>

          {/* ============ Quick Links ============ */}
          <View style={styles.quickLinks}>
            <TouchableOpacity
              onPress={() => router.push(`/trip/${id}/map`)}
              activeOpacity={0.7}
            >
              <Text variant="caption" style={styles.quickLinkText}>view on map →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/trip/${id}/memory-wizard`)}
              activeOpacity={0.7}
            >
              <Text variant="caption" style={styles.quickLinkText}>memory book →</Text>
            </TouchableOpacity>
          </View>

          {/* ============ DIVIDER ============ */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>your space · private</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ============ Private Folders ============ */}
          <View style={styles.foldersSection}>
            <View style={styles.foldersGrid}>
              <PlanningFolder
                icon="check-square"
                label="packing list"
                subtitle="0 items"
                color={colors.teal}
                onPress={() => router.push(`/trip/${id}/packing`)}
              />
              <PlanningFolder
                icon="file-text"
                label="documents"
                subtitle="visa, passport"
                color={colors.gold}
                onPress={() => router.push(`/trip/${id}/documents`)}
              />
              <PlanningFolder
                icon="dollar-sign"
                label="budget"
                subtitle="set budget"
                color={colors.coral}
                onPress={() => router.push(`/trip/${id}/budget`)}
              />
              <PlanningFolder
                icon="edit-3"
                label="notes"
                subtitle="trip notes"
                color={colors.stone}
                onPress={() => router.push(`/trip/${id}/notes`)}
              />
            </View>
          </View>

          {/* ============ Trip Settings ============ */}
          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => router.push(`/trip/${id}/settings`)}
            activeOpacity={0.7}
          >
            <View style={styles.settingsIcon}>
              <Feather name="settings" size={14} color={colors.stone} />
            </View>
            <View style={styles.settingsContent}>
              <Text variant="body" style={styles.settingsLabel}>trip settings</Text>
              <Text variant="caption" style={styles.settingsSub}>
                ownership, invite code, members
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.sand} />
          </TouchableOpacity>

          {/* ============ Photos ============ */}
          {recentPhotos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.photosHeader}>
                <Text variant="eyebrow" style={styles.sectionLabel}>photos</Text>
                <Text variant="caption" style={styles.photoCount}>{allPhotos.length}</Text>
              </View>
              <View style={styles.photoGrid}>
                {recentPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/trip/${id}/photo/${photo.id}`)}
                  >
                    <Image
                      source={{ uri: photo.thumbnail_url }}
                      style={styles.photoTile}
                      contentFit="cover"
                      transition={200}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text variant="title" style={styles.statValue}>{value}</Text>
      <Text variant="eyebrow">{label}</Text>
    </Card>
  );
}

function PlanningFolder({
  icon, label, subtitle, color, onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string; subtitle: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.folder} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.folderIcon, { backgroundColor: color + "14" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text variant="body" style={styles.folderLabel}>{label}</Text>
      <Text variant="caption" style={styles.folderSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  /* Hero */
  hero: { height: 220, position: "relative" },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.taupe, opacity: 0.25,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: spacing.lg, paddingTop: 56,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center", justifyContent: "center",
  },
  backText: { fontSize: 18, lineHeight: 20 },
  heroText: { gap: 4 },
  heroTitle: { color: colors.ink, fontSize: 28 },
  heroDates: { color: colors.stone },

  /* Stats */
  statsRow: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: spacing.lg, marginTop: -20,
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  statValue: { fontSize: 20 },

  /* Sections */
  section: { marginTop: spacing.lg },
  sectionLabel: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },

  /* Travel mates */
  matesHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  matesAdd: { color: colors.coral, fontFamily: "Inter_500Medium" },
  matesRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg,
  },
  mateCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.ivory,
  },
  matePending: {
    backgroundColor: "transparent",
    borderWidth: 1, borderColor: colors.sand, borderStyle: "dashed",
  },
  mateAdd: {
    backgroundColor: "transparent",
    borderWidth: 1, borderColor: colors.sand, borderStyle: "dashed",
  },
  mateInitial: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.pearl },
  matesLabel: { marginLeft: 10, color: colors.stone },

  /* Month calendar */
  monthWrap: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.pearl,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
  },
  monthTitle: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 18,
    color: colors.ink,
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
    color: colors.sand,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    paddingBottom: 4,
  },
  monthCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  monthCellTrip: {
    backgroundColor: colors.ink + "0F",
  },
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
    color: colors.ink,
  },
  monthDayNumTrip: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  monthDayNumToday: {
    color: colors.coral,
  },
  monthDayNumOff: {
    color: colors.sand,
  },
  monthDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.coral,
    marginTop: 2,
  },
  monthTodayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.coral,
    marginTop: 2,
    opacity: 0.4,
  },

  /* See full link */
  seeFullLink: { alignItems: "center", marginTop: spacing.sm },
  seeFullText: { fontSize: 11, color: colors.stone, fontFamily: "Inter_400Regular" },

  /* Quick links */
  quickLinks: {
    flexDirection: "row", justifyContent: "center",
    gap: 20, marginTop: spacing.md,
  },
  quickLinkText: { color: colors.stone },

  /* Divider */
  divider: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginHorizontal: spacing.lg, marginTop: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.mist },
  dividerLabel: {
    fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5,
    color: colors.sand, fontFamily: "Inter_600SemiBold",
  },

  /* Folders */
  foldersSection: { marginTop: spacing.md, paddingHorizontal: spacing.lg },
  foldersGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  folder: {
    width: "47%" as any, backgroundColor: colors.pearl,
    borderRadius: 12, padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.mist,
  },
  folderIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  folderLabel: {
    fontSize: 14, fontFamily: "Inter_500Medium",
    color: colors.ink, marginBottom: 2,
  },
  folderSub: { fontSize: 11, color: colors.stone },

  /* Trip settings link */
  settingsLink: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: 14,
    gap: 12,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.mist + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  settingsSub: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 1,
  },

  /* Photos */
  photosHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  photoCount: { color: colors.stone },
  photoGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 2, paddingHorizontal: spacing.lg,
  },
  photoTile: { width: PHOTO_TILE, height: PHOTO_TILE, borderRadius: 4 },
});
