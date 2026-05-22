import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text, Cairn } from "../../features/design-system";
import { Skeleton } from "../../features/shared";
import { ThemePicker } from "../../features/theme/ThemePicker";
import { useSession } from "../../lib/use-session";
import { useTrips } from "../../features/trips/hooks";
import { supabase } from "../../lib/supabase";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
      <Text variant="title" style={styles.statNumber}>{value}</Text>
      <Text variant="eyebrow" style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings item                                                      */
/* ------------------------------------------------------------------ */

function SettingsItem({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Feather name={icon} size={18} color={colors.ink} />
      <Text variant="body" style={{ flex: 1 }}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.sand} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

export default function YouTwoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session } = useSession();
  const { data: trips, isLoading } = useTrips(session?.user.id);

  const tripCount = trips?.length ?? 0;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (isLoading) {
    return (
      <Container logo>
        <View style={styles.scroll}>
          <View style={styles.titleRow}>
            <View style={{ width: 32 }} />
            <Skeleton width={120} height={32} borderRadius={6} />
            <Skeleton width={32} height={32} borderRadius={16} />
          </View>
          <View style={{ alignItems: "center", marginTop: spacing.lg }}>
            <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
            <Skeleton width={60} height={14} borderRadius={4} style={{ marginTop: spacing.sm }} />
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
        {/* Header with gear */}
        <View style={styles.titleRow}>
          <View style={{ width: 32 }} />
          <Text variant="display" style={styles.title}>me</Text>
          <TouchableOpacity
            style={[styles.gearBtn, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={16} color={colors.stone} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.coral }]}>
            <Text style={styles.avatarLetter}>P</Text>
          </View>
          <Text variant="caption" style={styles.nameLabel}>piggie</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard value={tripCount} label="trips" />
          <StatCard value={0} label="places saved" />
          <StatCard value={0} label="photos" />
        </View>

        {/* Tip card */}
        <View style={[styles.tipCard, { backgroundColor: colors.teal + "0D", borderColor: colors.teal + "25" }]}>
          <View style={[styles.tipIcon, { backgroundColor: colors.teal + "18" }]}>
            <Feather name="users" size={18} color={colors.teal} />
          </View>
          <View style={styles.tipBody}>
            <Text variant="body" style={styles.tipTitle}>
              invite friends per trip
            </Text>
            <Text variant="caption" style={[styles.tipDesc, { color: colors.stone }]}>
              open any trip and tap "travel mates" to invite friends to plan together
            </Text>
          </View>
        </View>

        {/* Theme picker */}
        <Text variant="eyebrow" style={styles.sectionEyebrow}>theme</Text>
        <View style={{ marginBottom: spacing.lg }}>
          <ThemePicker size="lg" />
        </View>

        {/* Settings */}
        <Text variant="eyebrow" style={styles.sectionEyebrow}>settings</Text>
        <View style={styles.settingsList}>
          <SettingsItem icon="user" label="edit profile" />
          <SettingsItem icon="bell" label="notifications" />
          <SettingsItem icon="lock" label="privacy" />
          <SettingsItem icon="help-circle" label="help & feedback" />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOut, { borderColor: colors.sand }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text variant="body" style={[styles.signOutText, { color: colors.stone }]}>sign out</Text>
        </TouchableOpacity>

        {/* Colophon */}
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

const AVATAR_SIZE = 64;

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  /* Header */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    textAlign: "center",
  },
  gearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: "Inter_500Medium",
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

  /* Tip card */
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.lg,
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
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* Settings */
  sectionEyebrow: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  settingsList: {
    gap: spacing.sm,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },

  /* Sign out */
  signOut: {
    marginTop: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: {},

  /* Colophon */
  colophonWrap: {
    alignItems: "center",
    marginTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
});
