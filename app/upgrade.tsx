import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text, Cairn } from "../features/design-system";
import { goBack } from "../lib/go-back";
import { useSubscription } from "../features/subscription/hooks";
import { useSubscriptionStore } from "../features/subscription/store";
import { PAID_PRICE } from "../features/subscription/constants";
import { useColors } from "../features/theme/ThemeProvider";
import { spacing } from "../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Comparison table data                                               */
/* ------------------------------------------------------------------ */

interface FeatureRow {
  label: string;
  free: string;
  pro: string;
  highlight?: boolean;
}

const FEATURES: FeatureRow[] = [
  { label: "active trips", free: "1", pro: "unlimited", highlight: true },
  { label: "activities per trip", free: "10", pro: "unlimited", highlight: true },
  { label: "travel mates", free: "2", pro: "unlimited" },
  { label: "photos per day", free: "5", pro: "unlimited" },
  { label: "past trips visible", free: "1", pro: "all" },
  { label: "memory book", free: "—", pro: "included", highlight: true },
  { label: "offline access", free: "—", pro: "included" },
  { label: "pdf export", free: "—", pro: "$4.99/trip" },
];

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function UpgradeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPaid } = useSubscription();
  const setTier = useSubscriptionStore((s) => s.setTier);

  function handleUpgrade() {
    Alert.alert(
      "upgrade to pro",
      `one-time purchase of $${PAID_PRICE}. yours forever, no subscriptions.`,
      [
        { text: "not now", style: "cancel" },
        {
          text: "upgrade",
          onPress: () => {
            setTier("paid");
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Container logo>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="eyebrow">upgrade</Text>
          <View style={{ width: 20 }} />
        </View>

        {/* ---- Hero ---- */}
        <View style={styles.hero}>
          <Cairn size="md" layout="vertical" animate={false} />
          <Text variant="display" style={[styles.heroTitle, { color: colors.ink }]}>
            unlock everything
          </Text>
          <Text variant="body" style={[styles.heroSub, { color: colors.stone }]}>
            one payment, yours forever
          </Text>
        </View>

        {/* ---- Price badge ---- */}
        <View style={[styles.priceBadge, { backgroundColor: colors.ink }]}>
          <Text style={styles.priceAmount}>${PAID_PRICE}</Text>
          <Text style={styles.priceLabel}>one-time · no subscription</Text>
        </View>

        {/* ---- Comparison table ---- */}
        <View style={[styles.table, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          {/* Table header */}
          <View style={[styles.tableHeader, { borderBottomColor: colors.mist }]}>
            <Text style={[styles.tableHeaderLabel, { color: colors.stone }]}>feature</Text>
            <Text style={[styles.tableHeaderCol, { color: colors.stone }]}>free</Text>
            <Text style={[styles.tableHeaderCol, { color: colors.coral }]}>pro</Text>
          </View>

          {/* Table rows */}
          {FEATURES.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.tableRow,
                i < FEATURES.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.mist,
                },
              ]}
            >
              <Text
                style={[
                  styles.tableLabel,
                  { color: colors.ink },
                  row.highlight && { fontFamily: "InstrumentSans_500Medium" },
                ]}
              >
                {row.label}
              </Text>
              <Text style={[styles.tableFreeVal, { color: colors.sand }]}>
                {row.free}
              </Text>
              <View style={styles.tableProCell}>
                {row.pro === "unlimited" || row.pro === "all" || row.pro === "included" ? (
                  <View style={styles.proValRow}>
                    <Feather name="check" size={12} color={colors.teal} />
                    <Text style={[styles.tableProVal, { color: colors.teal }]}>
                      {row.pro}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.tableProVal, { color: colors.ink }]}>
                    {row.pro}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ---- Upgrade button ---- */}
        {!isPaid && (
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.coral }]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={16} color="#fff" />
            <Text style={styles.upgradeBtnText}>
              upgrade now — ${PAID_PRICE}
            </Text>
          </TouchableOpacity>
        )}

        {isPaid && (
          <View style={[styles.activeCard, { backgroundColor: colors.teal + "0D", borderColor: colors.teal + "25" }]}>
            <Feather name="check-circle" size={20} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text variant="body" style={[styles.activeTitle, { color: colors.ink }]}>
                you're on pro
              </Text>
              <Text variant="caption" style={{ color: colors.stone }}>
                all features unlocked, forever
              </Text>
            </View>
          </View>
        )}

        {/* ---- Maybe later ---- */}
        {!isPaid && (
          <TouchableOpacity
            style={styles.laterBtn}
            onPress={() => goBack(router)}
            activeOpacity={0.7}
          >
            <Text style={[styles.laterText, { color: colors.stone }]}>
              maybe later
            </Text>
          </TouchableOpacity>
        )}

        {/* ---- Fine print ---- */}
        <Text variant="caption" style={[styles.finePrint, { color: colors.sand }]}>
          one-time purchase. no recurring charges.{"\n"}
          restore anytime on any device.
        </Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroTitle: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  heroSub: {
    textAlign: "center",
  },

  /* Price badge */
  priceBadge: {
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  priceAmount: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 32,
    color: "#fff",
    lineHeight: 36,
  },
  priceLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },

  /* Table */
  table: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableHeaderLabel: {
    flex: 1,
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  tableHeaderCol: {
    width: 80,
    textAlign: "center",
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tableLabel: {
    flex: 1,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13,
  },
  tableFreeVal: {
    width: 80,
    textAlign: "center",
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13,
  },
  tableProCell: {
    width: 80,
    alignItems: "center",
  },
  proValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tableProVal: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
  },

  /* Upgrade button */
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 18,
    marginBottom: spacing.sm,
  },
  upgradeBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 15,
    color: "#fff",
  },

  /* Active card */
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  activeTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },

  /* Maybe later */
  laterBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  laterText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13,
  },

  /* Fine print */
  finePrint: {
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
