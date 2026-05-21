import { useState, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";
import { useSubscription } from "../../features/subscription/hooks";
import { useSubscriptionStore } from "../../features/subscription/store";
import { PAID_PRICE_MONTHLY } from "../../features/subscription/constants";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Settings row                                                        */
/* ------------------------------------------------------------------ */

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: danger ? colors.coral + "14" : colors.teal + "14" },
        ]}
      >
        <Feather
          name={icon}
          size={15}
          color={danger ? colors.coral : colors.teal}
        />
      </View>
      <Text
        style={[styles.rowLabel, danger && { color: colors.coral }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Feather name="chevron-right" size={14} color={colors.sand} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

type MemoryOrder = {
  tripId: string;
  plan: string;
  price: number;
  orderedAt: string;
  status: string;
  shipping: { name: string; address: string; city: string; zip: string; country: string } | null;
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Feather.glyphMap }> = {
  complete: { color: colors.teal, label: "digital ready", icon: "check-circle" },
  processing: { color: colors.coral, label: "processing", icon: "loader" },
  printing: { color: colors.gold, label: "printing", icon: "printer" },
  shipped: { color: colors.teal, label: "shipped", icon: "truck" },
  delivered: { color: colors.teal, label: "delivered", icon: "package" },
};

function BookCard({ order, onPress }: { order: MemoryOrder; onPress: () => void }) {
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.complete;
  const date = new Date(order.orderedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <TouchableOpacity style={styles.bookCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.bookCover}>
        <Feather name="book" size={20} color={colors.coral} />
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>
          {order.plan === "print" ? "printed + digital" : "digital book"}
        </Text>
        <Text variant="caption" style={styles.bookDate}>{dateStr}</Text>
      </View>
      <View style={[styles.bookStatus, { backgroundColor: status.color + "14" }]}>
        <Feather name={status.icon} size={10} color={status.color} />
        <Text style={[styles.bookStatusText, { color: status.color }]}>{status.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { session } = useSession();
  const router = useRouter();
  const email = session?.user.email ?? "";
  const initial = email.charAt(0).toUpperCase();

  const { tier, isPaid } = useSubscription();
  const setTier = useSubscriptionStore((s) => s.setTier);
  const [devTaps, setDevTaps] = useState(0);

  const [orders, setOrders] = useState<MemoryOrder[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("memory_orders").then((val) => {
        if (val) setOrders(JSON.parse(val));
      });
    }, [])
  );

  async function handleSignOut() {
    Alert.alert("sign out", "are you sure you want to sign out?", [
      { text: "cancel", style: "cancel" },
      {
        text: "sign out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  function comingSoon(feature: string) {
    Alert.alert("coming soon", `${feature} will be available in a future update.`);
  }

  function handleDevToggle() {
    setTier(isPaid ? "free" : "paid");
    setDevTaps(0);
  }

  return (
    <Container safe>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Avatar & name ---- */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <Text variant="title" style={styles.displayName}>
            {email.split("@")[0]}
          </Text>
          <Text variant="caption" style={styles.email}>
            {email}
          </Text>
        </View>

        {/* ---- Plan section (subscription) ---- */}
        <SectionHeader title="your plan" />
        <View style={styles.card}>
          <View style={styles.planInner}>
            <View style={styles.planRow}>
              <View style={[styles.planBadge, isPaid && styles.planBadgePaid]}>
                <Text variant="body" style={[styles.planBadgeText, isPaid && styles.planBadgeTextPaid]}>
                  {isPaid ? "paid" : "free"}
                </Text>
              </View>
              {isPaid ? (
                <Text variant="caption">
                  ${PAID_PRICE_MONTHLY}/month
                </Text>
              ) : (
                <Text variant="caption">
                  1 trip · 10 activities
                </Text>
              )}
            </View>

            {!isPaid && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => router.push("/(auth)/paywall")}
                activeOpacity={0.85}
              >
                <Text variant="body" style={styles.upgradeBtnText}>
                  upgrade — ${PAID_PRICE_MONTHLY}/mo
                </Text>
              </TouchableOpacity>
            )}

            {isPaid && (
              <TouchableOpacity style={styles.manageLink} activeOpacity={0.8}>
                <Text variant="caption" style={styles.manageLinkText}>
                  manage subscription
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ---- My Books ---- */}
        {orders.length > 0 && (
          <>
            <SectionHeader title="my books" />
            <View style={styles.card}>
              {orders.map((order, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.separator} />}
                  <BookCard
                    order={order}
                    onPress={() => {
                      if (order.plan === "print" && order.status !== "complete") {
                        router.push(`/trip/${order.tripId}/memory-tracking`);
                      } else {
                        router.push(`/trip/${order.tripId}/memory`);
                      }
                    }}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* ---- Account ---- */}
        <SectionHeader title="account" />
        <View style={styles.card}>
          <SettingRow
            icon="user"
            label="edit profile"
            onPress={() => comingSoon("edit profile")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="lock"
            label="change password"
            onPress={() => comingSoon("change password")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="mail"
            label="email"
            value={email}
            onPress={() => comingSoon("change email")}
          />
        </View>

        {/* ---- Preferences ---- */}
        <SectionHeader title="preferences" />
        <View style={styles.card}>
          <SettingRow
            icon="bell"
            label="notifications"
            onPress={() => comingSoon("notifications")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="globe"
            label="language"
            value="english"
            onPress={() => comingSoon("language settings")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="moon"
            label="appearance"
            value="light"
            onPress={() => comingSoon("appearance settings")}
          />
        </View>

        {/* ---- Support ---- */}
        <SectionHeader title="support" />
        <View style={styles.card}>
          <SettingRow
            icon="help-circle"
            label="help & feedback"
            onPress={() => comingSoon("help & feedback")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="star"
            label="rate the app"
            onPress={() => comingSoon("rate the app")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="share-2"
            label="share with friends"
            onPress={() => comingSoon("share")}
          />
        </View>

        {/* ---- Legal ---- */}
        <SectionHeader title="legal" />
        <View style={styles.card}>
          <SettingRow
            icon="file-text"
            label="terms of service"
            onPress={() => comingSoon("terms of service")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="shield"
            label="privacy policy"
            onPress={() => comingSoon("privacy policy")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="info"
            label="cookie policy"
            onPress={() => comingSoon("cookie policy")}
          />
        </View>

        {/* ---- Data & Security ---- */}
        <SectionHeader title="data & security" />
        <View style={styles.card}>
          <SettingRow
            icon="download"
            label="export my data"
            onPress={() => comingSoon("data export")}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="trash-2"
            label="delete account"
            danger
            onPress={() =>
              Alert.alert(
                "delete account",
                "this action is permanent and cannot be undone. all your trips, photos, and data will be removed.",
                [
                  { text: "cancel", style: "cancel" },
                  {
                    text: "delete",
                    style: "destructive",
                    onPress: () => comingSoon("account deletion"),
                  },
                ]
              )
            }
          />
        </View>

        {/* ---- Sign out ---- */}
        <TouchableOpacity
          style={styles.signOut}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={14} color={colors.stone} />
          <Text variant="body" style={styles.signOutText}>
            sign out
          </Text>
        </TouchableOpacity>

        {/* Hidden dev toggle — tap version 5 times to switch tiers */}
        <TouchableOpacity
          style={styles.devTrigger}
          onPress={() => {
            const next = devTaps + 1;
            if (next >= 5) {
              handleDevToggle();
            } else {
              setDevTaps(next);
            }
          }}
          activeOpacity={1}
        >
          <Text style={styles.version}>sotrip v1.0.0</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.xl + 20 },

  /* Header */
  header: { alignItems: "center", marginBottom: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarLetter: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 30,
    color: colors.pearl,
  },
  displayName: { fontSize: 20, marginBottom: 4 },
  email: { color: colors.stone },

  /* Plan section */
  planInner: {
    padding: spacing.md,
    gap: 12,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planBadge: {
    backgroundColor: colors.mist,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgePaid: {
    backgroundColor: colors.ink,
  },
  planBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: colors.stone,
  },
  planBadgeTextPaid: {
    color: colors.ivory,
  },
  upgradeBtn: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  upgradeBtnText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
  manageLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  manageLinkText: {
    color: colors.stone,
    textDecorationLine: "underline",
  },

  /* Section */
  sectionTitle: {
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    color: colors.sand,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  /* Card group */
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.pearl,
    borderRadius: 14,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mist,
    marginLeft: 50,
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  rowValue: {
    fontSize: 12,
    color: colors.stone,
    fontFamily: "Inter_400Regular",
    maxWidth: 120,
  },

  /* Book card */
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  bookCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.coral + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  bookInfo: { flex: 1, gap: 2 },
  bookTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
  },
  bookDate: { fontSize: 11, color: colors.stone },
  bookStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bookStatusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 0.3,
  },

  /* Sign out */
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 12,
    paddingVertical: 14,
  },
  signOutText: { color: colors.stone, fontSize: 14 },

  /* Dev toggle & Version */
  devTrigger: {
    alignItems: "center",
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  version: {
    textAlign: "center",
    fontSize: 10,
    color: colors.sand,
    marginTop: spacing.md,
    fontFamily: "Inter_400Regular",
  },
});
