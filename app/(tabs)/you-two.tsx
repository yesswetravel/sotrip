import { useState, useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Container, Text, Cairn } from "../../features/design-system";
import type { TripWithDaysAndItems } from "../../types/database";
import { Skeleton } from "../../features/shared";
import { ThemePicker } from "../../features/theme/ThemePicker";
import { useSession } from "../../lib/use-session";
import { useTrips } from "../../features/trips/hooks";
import { useSubscription } from "../../features/subscription/hooks";
import { useSubscriptionStore } from "../../features/subscription/store";
import { PAID_PRICE } from "../../features/subscription/constants";
import { supabase } from "../../lib/supabase";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.pearl, borderColor: colors.mist },
      ]}
    >
      <Text variant="title" style={styles.statNumber}>
        {value}
      </Text>
      <Text variant="eyebrow" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

const AVATAR_SIZE = 64;

export default function MeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session } = useSession();
  const { data: trips, isLoading } = useTrips(session?.user.id);
  const { isPaid } = useSubscription();
  const setTier = useSubscriptionStore((s) => s.setTier);
  const queryClient = useQueryClient();

  const tripCount = trips?.length ?? 0;

  /* Compute real stats from cached trip details */
  const { placesCount, photosCount } = useMemo(() => {
    let places = 0;
    let photos = 0;
    (trips ?? []).forEach((t) => {
      const detail = queryClient.getQueryData<TripWithDaysAndItems>(["trip", t.id]);
      if (detail?.trip_days) {
        detail.trip_days.forEach((d) => {
          places += d.trip_items?.length ?? 0;
          d.trip_items?.forEach((item) => {
            if (item.photo_uri) photos += 1;
          });
        });
      }
    });
    return { placesCount: places, photosCount: photos };
  }, [trips, queryClient]);

  const email = session?.user.email ?? "";
  const displayName = email ? email.split("@")[0] : "traveller";
  const initial = displayName.charAt(0).toUpperCase();

  /* Dev toggle — 5 taps on version to switch tier */
  const [devTaps, setDevTaps] = useState(0);

  function handleSignOut() {
    Alert.alert("sign out", "are you sure you want to sign out?", [
      { text: "cancel", style: "cancel" },
      {
        text: "sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          useSubscriptionStore.getState().reset();
          queryClient.clear();
        },
      },
    ]);
  }

  function handleClearData() {
    Alert.alert(
      "clear all data",
      "this will delete all your trips, plans, and photos. this cannot be undone.",
      [
        { text: "cancel", style: "cancel" },
        {
          text: "delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete in order: items → days → trips (respects foreign keys)
              const { data: myTrips } = await supabase.from("trips").select("id");
              if (myTrips && myTrips.length > 0) {
                const tripIds = myTrips.map((t) => t.id);
                // Get all day IDs for these trips
                const { data: myDays } = await supabase
                  .from("trip_days")
                  .select("id")
                  .in("trip_id", tripIds);
                if (myDays && myDays.length > 0) {
                  const dayIds = myDays.map((d) => d.id);
                  await supabase.from("trip_items").delete().in("trip_day_id", dayIds);
                }
                await supabase.from("trip_days").delete().in("trip_id", tripIds);
                await supabase.from("trips").delete().in("id", tripIds);
              }
              queryClient.clear();
              Alert.alert("done", "all data cleared — you're starting fresh!");
            } catch (err: any) {
              Alert.alert("error", err?.message || "couldn't clear data");
            }
          },
        },
      ]
    );
  }

  /* Loading skeleton */
  if (isLoading) {
    return (
      <Container logo>
        <View style={styles.scroll}>
          <View style={{ alignItems: "center" }}>
            <Skeleton width={60} height={28} borderRadius={6} />
          </View>
          <View style={{ alignItems: "center", marginTop: spacing.lg }}>
            <Skeleton
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
            />
            <Skeleton
              width={80}
              height={14}
              borderRadius={4}
              style={{ marginTop: spacing.sm }}
            />
          </View>
          <View style={styles.statsRow}>
            <Skeleton width={100} height={60} borderRadius={10} style={{ flex: 1 }} />
            <Skeleton width={100} height={60} borderRadius={10} style={{ flex: 1 }} />
            <Skeleton width={100} height={60} borderRadius={10} style={{ flex: 1 }} />
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container logo>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Header ---- */}
        <Text variant="display" style={styles.title}>
          me
        </Text>

        {/* ---- Avatar ---- */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.coral }]}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text variant="caption" style={styles.nameLabel}>
            {displayName}
          </Text>
        </View>

        {/* ---- Stats ---- */}
        <View style={styles.statsRow}>
          <StatCard value={tripCount} label="trips" />
          <StatCard value={placesCount} label="places saved" />
          <StatCard value={photosCount} label="photos" />
        </View>

        {/* ---- Plan / Upgrade ---- */}
        {isPaid ? (
          <View
            style={[
              styles.planCard,
              { backgroundColor: colors.teal + "0D", borderColor: colors.teal + "25" },
            ]}
          >
            <View style={[styles.planIcon, { backgroundColor: colors.teal + "18" }]}>
              <Feather name="check-circle" size={18} color={colors.teal} />
            </View>
            <View style={styles.planBody}>
              <View style={styles.planTitleRow}>
                <Text variant="body" style={[styles.planTitle, { color: colors.ink }]}>
                  sotrip pro
                </Text>
                <View style={[styles.proBadge, { backgroundColor: colors.teal + "18" }]}>
                  <Text style={[styles.proBadgeText, { color: colors.teal }]}>active</Text>
                </View>
              </View>
              <Text variant="caption" style={{ color: colors.stone }}>
                unlimited trips, places, photos & more
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.upgradeCard,
              { backgroundColor: colors.coral + "0D", borderColor: colors.coral + "25" },
            ]}
            onPress={() => router.push("/upgrade")}
            activeOpacity={0.7}
          >
            <View style={[styles.planIcon, { backgroundColor: colors.coral + "18" }]}>
              <Feather name="zap" size={18} color={colors.coral} />
            </View>
            <View style={styles.planBody}>
              <Text variant="body" style={[styles.planTitle, { color: colors.ink }]}>
                upgrade to pro
              </Text>
              <Text variant="caption" style={{ color: colors.stone }}>
                unlimited everything — ${PAID_PRICE} once, forever
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.coral} />
          </TouchableOpacity>
        )}

        {/* ---- Memory books ---- */}
        <Text variant="eyebrow" style={styles.sectionEyebrow}>
          memory books
        </Text>
        {trips && trips.length > 0 ? (
          <View style={styles.memoryList}>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={[
                  styles.memoryCard,
                  { backgroundColor: colors.pearl, borderColor: colors.mist },
                ]}
                onPress={() => router.push(`/trip/${trip.id}/memory`)}
                activeOpacity={0.7}
              >
                <View style={[styles.memoryIcon, { backgroundColor: colors.coral + "14" }]}>
                  <Feather name="book" size={18} color={colors.coral} />
                </View>
                <View style={styles.memoryBody}>
                  <Text variant="body" style={[styles.memoryTitle, { color: colors.ink }]}>
                    {trip.title}
                  </Text>
                  <Text variant="caption" style={{ color: colors.stone }}>
                    tap to create a memory book
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={colors.sand} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.memoryEmpty,
              { backgroundColor: colors.pearl, borderColor: colors.mist },
            ]}
          >
            <View style={[styles.memoryEmptyIcon, { backgroundColor: colors.coral + "14" }]}>
              <Feather name="book" size={24} color={colors.coral} />
            </View>
            <Text variant="titleItalic" style={[styles.memoryEmptyTitle, { color: colors.ink }]}>
              no memory books yet
            </Text>
            <Text variant="caption" style={[styles.memoryEmptyDesc, { color: colors.stone }]}>
              create a trip first, then turn your best moments into a beautiful keepsake book
            </Text>
          </View>
        )}

        {/* ---- Tip card ---- */}
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.teal + "0D", borderColor: colors.teal + "25" },
          ]}
        >
          <View style={[styles.tipIcon, { backgroundColor: colors.teal + "18" }]}>
            <Feather name="users" size={18} color={colors.teal} />
          </View>
          <View style={styles.tipBody}>
            <Text variant="body" style={styles.tipTitle}>
              invite friends per trip
            </Text>
            <Text variant="caption" style={[styles.tipDesc, { color: colors.stone }]}>
              open any trip and tap "travel mates" to invite friends to plan
              together
            </Text>
          </View>
        </View>

        {/* ---- Theme picker ---- */}
        <Text variant="eyebrow" style={styles.sectionEyebrow}>
          theme
        </Text>
        <View style={{ marginBottom: spacing.lg }}>
          <ThemePicker size="lg" />
        </View>

        {/* ---- Settings ---- */}
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={15} color={colors.stone} />
          <Text variant="body" style={[styles.settingsBtnText, { color: colors.ink }]}>
            settings
          </Text>
          <Feather name="chevron-right" size={14} color={colors.sand} />
        </TouchableOpacity>

        {/* ---- Clear data ---- */}
        <TouchableOpacity
          style={[styles.signOut, { borderColor: colors.mist }]}
          onPress={handleClearData}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={14} color="#C44" />
          <Text variant="body" style={[styles.signOutText, { color: "#C44" }]}>
            clear all data
          </Text>
        </TouchableOpacity>

        {/* ---- Sign out ---- */}
        <TouchableOpacity
          style={[styles.signOut, { borderColor: colors.mist }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={14} color={colors.stone} />
          <Text variant="body" style={[styles.signOutText, { color: colors.stone }]}>
            sign out
          </Text>
        </TouchableOpacity>

        {/* ---- Version / Dev toggle ---- */}
        <TouchableOpacity
          style={styles.devTrigger}
          onPress={() => {
            const next = devTaps + 1;
            if (next >= 5) {
              setTier(isPaid ? "free" : "paid");
              setDevTaps(0);
            } else {
              setDevTaps(next);
            }
          }}
          activeOpacity={1}
        >
          <Text style={[styles.version, { color: colors.sand }]}>
            sotrip v1.0.0
          </Text>
        </TouchableOpacity>

        {__DEV__ && devTaps >= 3 && (
          <TouchableOpacity
            style={styles.seedLink}
            onPress={() => router.push("/dev/seed")}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={12} color={colors.coral} />
            <Text style={[styles.seedLinkText, { color: colors.coral }]}>
              seed demo trip
            </Text>
          </TouchableOpacity>
        )}

        {/* ---- Colophon ---- */}
        <View style={styles.colophonWrap}>
          <Cairn size="sm" layout="vertical" tagline animate={false} />
        </View>
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  /* Header */
  title: {
    textAlign: "center",
  },

  /* Avatar */
  avatarSection: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 24,
    color: "#FFFFFF",
  },
  nameLabel: {
    marginTop: spacing.sm,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statNumber: {
    textAlign: "center",
  },
  statLabel: {
    textAlign: "center",
    marginTop: spacing.xs,
  },

  /* Plan card */
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planBody: {
    flex: 1,
    gap: 2,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  proBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* Tip card */
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipBody: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* Memory books */
  memoryList: {
    gap: spacing.sm,
  },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: spacing.md,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  memoryBody: {
    flex: 1,
    gap: 2,
  },
  memoryTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  memoryEmpty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  memoryEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  memoryEmptyTitle: {
    textAlign: "center",
  },
  memoryEmptyDesc: {
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },

  /* Section */
  sectionEyebrow: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  /* Settings button */
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsBtnText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "InstrumentSans_500Medium",
  },

  /* Sign out */
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: 14,
  },

  /* Dev toggle */
  devTrigger: {
    alignItems: "center",
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  version: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "InstrumentSans_400Regular",
  },
  seedLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  seedLinkText: {
    fontSize: 11,
    fontFamily: "InstrumentSans_500Medium",
  },

  /* Colophon */
  colophonWrap: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
