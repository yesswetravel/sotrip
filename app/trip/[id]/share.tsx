import { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useTrip } from "../../../features/trips/hooks";
import { useTripMembers } from "../../../features/couple/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { useToast } from "../../../features/shared/toast-context";
import { getCategoryForItem } from "../../../theme/categories";
import { spacing } from "../../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const SHARE_CODE_KEY = (tripId: string) => `@trip:${tripId}:share_code`;

function generateShareCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function dayCount(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/* ------------------------------------------------------------------ */
/*  Preview card                                                        */
/* ------------------------------------------------------------------ */

function PreviewCard({
  trip,
  memberCount,
  shareUrl,
}: {
  trip: NonNullable<ReturnType<typeof useTrip>["data"]>;
  memberCount: number;
  shareUrl: string;
}) {
  const colors = useColors();
  const days = dayCount(trip.start_date, trip.end_date);
  const totalItems = trip.trip_days.reduce((sum, d) => sum + d.trip_items.length, 0);

  return (
    <View style={[styles.previewCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
      {/* Header accent bar */}
      <View style={[styles.previewAccent, { backgroundColor: colors.coral }]} />

      <View style={styles.previewInner}>
        {/* Trip title */}
        <Text variant="display" style={[styles.previewTitle, { color: colors.ink }]}>
          {trip.title}
        </Text>

        {/* Destination */}
        {trip.destination ? (
          <View style={styles.previewRow}>
            <Feather name="map-pin" size={12} color={colors.stone} />
            <Text variant="caption" style={{ color: colors.stone }}>
              {trip.destination}
            </Text>
          </View>
        ) : null}

        {/* Dates */}
        <View style={styles.previewRow}>
          <Feather name="calendar" size={12} color={colors.stone} />
          <Text variant="caption" style={{ color: colors.stone }}>
            {formatDateRange(trip.start_date, trip.end_date)}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.previewStats}>
          <View style={[styles.statPill, { backgroundColor: colors.ink + "0A" }]}>
            <Feather name="sun" size={10} color={colors.ink} />
            <Text style={[styles.statText, { color: colors.ink }]}>
              {days} {days === 1 ? "day" : "days"}
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.coral + "0A" }]}>
            <Feather name="map-pin" size={10} color={colors.coral} />
            <Text style={[styles.statText, { color: colors.coral }]}>
              {totalItems} {totalItems === 1 ? "place" : "places"}
            </Text>
          </View>
          {memberCount > 0 && (
            <View style={[styles.statPill, { backgroundColor: colors.teal + "0A" }]}>
              <Feather name="users" size={10} color={colors.teal} />
              <Text style={[styles.statText, { color: colors.teal }]}>
                {memberCount + 1} going
              </Text>
            </View>
          )}
        </View>

        {/* Day-by-day preview */}
        {trip.trip_days
          .filter((d) => d.trip_items.length > 0)
          .slice(0, 4)
          .map((day) => {
            const dateLabel = day.date ? formatDate(day.date) : `day ${day.day_number}`;
            return (
              <View key={day.id} style={styles.dayPreview}>
                <View style={[styles.dayDot, { backgroundColor: colors.coral }]} />
                <View style={styles.dayContent}>
                  <Text style={[styles.dayLabel, { color: colors.ink }]}>
                    {dateLabel}
                  </Text>
                  <Text
                    style={[styles.dayItems, { color: colors.stone }]}
                    numberOfLines={1}
                  >
                    {day.trip_items
                      .slice(0, 3)
                      .map((item) => item.title)
                      .join(" · ")}
                    {day.trip_items.length > 3 ? ` +${day.trip_items.length - 3}` : ""}
                  </Text>
                </View>
              </View>
            );
          })}

        {trip.trip_days.filter((d) => d.trip_items.length > 0).length > 4 && (
          <Text variant="caption" style={[styles.moreText, { color: colors.sand }]}>
            + {trip.trip_days.filter((d) => d.trip_items.length > 0).length - 4} more days
          </Text>
        )}

        {/* Footer */}
        <View style={[styles.previewFooter, { borderTopColor: colors.mist }]}>
          <Text style={[styles.previewUrl, { color: colors.sand }]}>
            {shareUrl}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function ShareTripScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: trip, isLoading } = useTrip(id);
  const { memberCount } = useTripMembers(id);

  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let code = await AsyncStorage.getItem(SHARE_CODE_KEY(id));
      if (!code) {
        code = generateShareCode();
        await AsyncStorage.setItem(SHARE_CODE_KEY(id), code);
      }
      setShareCode(code);
    })();
  }, [id]);

  const shareUrl = `sotrip.app/t/${shareCode}`;
  const fullUrl = `https://${shareUrl}`;

  const shareMessage = useMemo(() => {
    if (!trip) return "";
    const destination = trip.destination ? ` to ${trip.destination}` : "";
    const dates = formatDateRange(trip.start_date, trip.end_date);
    const totalItems = trip.trip_days.reduce((sum, d) => sum + d.trip_items.length, 0);

    let msg = `${trip.title}${destination}\n`;
    if (dates) msg += `${dates}\n`;
    msg += "\n";

    // Day highlights
    trip.trip_days
      .filter((d) => d.trip_items.length > 0)
      .slice(0, 5)
      .forEach((day) => {
        const label = day.date ? formatDate(day.date) : `day ${day.day_number}`;
        const items = day.trip_items.slice(0, 3).map((i) => i.title).join(", ");
        msg += `${label}: ${items}\n`;
      });

    msg += `\n${fullUrl}`;
    return msg;
  }, [trip, fullUrl]);

  async function handleShare() {
    try {
      await Share.share({
        message: shareMessage,
        ...(Platform.OS === "ios" ? { subject: trip?.title ?? "our trip" } : {}),
      });
    } catch {}
  }

  async function handleCopyLink() {
    await Clipboard.setStringAsync(fullUrl);
    setCopied(true);
    toast.show("link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyItinerary() {
    await Clipboard.setStringAsync(shareMessage);
    toast.show("itinerary copied!");
  }

  if (isLoading || !trip) {
    return (
      <Container logo>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="eyebrow">share trip</Text>
          <View style={{ width: 20 }} />
        </View>
      </Container>
    );
  }

  return (
    <Container logo>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">share trip</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Heading */}
        <View style={styles.headingSection}>
          <Text variant="display" style={[styles.heading, { color: colors.ink }]}>
            share your itinerary
          </Text>
          <Text variant="caption" style={[styles.headingSub, { color: colors.stone }]}>
            send a beautiful summary of your trip to friends, family, or anyone
          </Text>
        </View>

        {/* Link box */}
        <View style={[styles.linkBox, { backgroundColor: colors.pearl, borderColor: colors.sand }]}>
          <View style={[styles.linkIcon, { backgroundColor: colors.coral + "14" }]}>
            <Feather name="link" size={14} color={colors.coral} />
          </View>
          <Text
            style={[styles.linkText, { color: colors.ink }]}
            numberOfLines={1}
          >
            {shareUrl}
          </Text>
          <TouchableOpacity
            style={[styles.linkCopyBtn, { backgroundColor: copied ? colors.teal : colors.ink }]}
            onPress={handleCopyLink}
            activeOpacity={0.85}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={12}
              color={colors.pearl}
            />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <Text variant="eyebrow" style={[styles.sectionLabel, { color: colors.sand }]}>
          preview
        </Text>
        <PreviewCard
          trip={trip}
          memberCount={memberCount}
          shareUrl={shareUrl}
        />

        {/* Share buttons */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.coral }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather name="share" size={16} color={colors.pearl} style={{ marginRight: 8 }} />
          <Text style={[styles.shareBtnText, { color: colors.pearl }]}>
            share trip
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
            onPress={handleCopyItinerary}
            activeOpacity={0.7}
          >
            <Feather name="clipboard" size={14} color={colors.ink} />
            <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>
              copy itinerary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
            onPress={() => router.push(`/trip/${id}/invite`)}
            activeOpacity={0.7}
          >
            <Feather name="user-plus" size={14} color={colors.teal} />
            <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>
              invite to plan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info note */}
        <View style={[styles.infoCard, { backgroundColor: colors.teal + "0D", borderColor: colors.teal + "25" }]}>
          <Feather name="info" size={14} color={colors.teal} />
          <Text variant="caption" style={[styles.infoText, { color: colors.stone }]}>
            sharing sends a read-only summary. to let someone edit this trip, use "invite to plan" instead.
          </Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scroll: {
    paddingTop: spacing.sm,
  },

  /* Heading */
  headingSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  heading: {
    textAlign: "center",
    fontSize: 26,
  },
  headingSub: {
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  /* Link box */
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: spacing.lg,
  },
  linkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    flex: 1,
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  linkCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Section */
  sectionLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "InstrumentSans_500Medium",
    marginBottom: spacing.sm,
  },

  /* Preview card */
  previewCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  previewAccent: {
    height: 4,
  },
  previewInner: {
    padding: spacing.md,
  },
  previewTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  previewStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 11,
  },

  /* Day preview */
  dayPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  dayContent: {
    flex: 1,
    gap: 1,
  },
  dayLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 12,
  },
  dayItems: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 11,
  },
  moreText: {
    fontSize: 11,
    marginLeft: 16,
    marginTop: 2,
  },

  /* Footer */
  previewFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 10,
    alignItems: "center",
  },
  previewUrl: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 10,
    letterSpacing: 0.5,
  },

  /* Share buttons */
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: 12,
  },
  shareBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 15,
  },

  secondaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.lg,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 12,
  },

  /* Info */
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
