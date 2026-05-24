import { StyleSheet, TouchableOpacity, View, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useSubscription } from "../../features/subscription/hooks";
import { PAID_PRICE } from "../../features/subscription/constants";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Feature comparison row                                              */
/* ------------------------------------------------------------------ */

function FeatureRow({
  label,
  free,
  pro,
}: {
  label: string;
  free: string;
  pro: string;
}) {
  const colors = useColors();

  return (
    <View style={styles.featureRow}>
      <Text style={[styles.featureLabel, { color: colors.ink }]}>{label}</Text>
      <View style={styles.featureValues}>
        <Text style={[styles.featureValue, { color: colors.stone }]}>{free}</Text>
        <Text style={[styles.featureValue, styles.proValue, { color: colors.coral }]}>
          {pro}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function ManagePlanScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPaid } = useSubscription();

  function handleManagePurchase() {
    Alert.alert("coming soon", "purchase management will be available in a future update.");
  }

  return (
    <Container safe logo>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Header ---- */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => goBack(router, "/(tabs)/profile")}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="title" style={styles.headerTitle}>
            your plan
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* ---- Current plan badge ---- */}
        <View style={[styles.planCard, { backgroundColor: colors.pearl }]}>
          <View style={styles.planTop}>
            <View
              style={[
                styles.planBadge,
                { backgroundColor: isPaid ? colors.ink : colors.mist },
              ]}
            >
              <Text
                style={[
                  styles.planBadgeText,
                  { color: isPaid ? colors.ivory : colors.stone },
                ]}
              >
                {isPaid ? "pro" : "free"}
              </Text>
            </View>
            {isPaid && (
              <Feather name="check-circle" size={18} color={colors.teal} />
            )}
          </View>
          <Text variant="body" style={[styles.planDesc, { color: colors.stone }]}>
            {isPaid
              ? "you've unlocked everything — forever."
              : "you're on the free plan with basic features."}
          </Text>
        </View>

        {isPaid ? (
          /* ---- Paid state ---- */
          <>
            <View style={styles.unlockedSection}>
              <View style={[styles.unlockedIcon, { backgroundColor: colors.teal + "14" }]}>
                <Feather name="unlock" size={20} color={colors.teal} />
              </View>
              <Text variant="title" style={styles.unlockedTitle}>
                unlocked forever
              </Text>
              <Text variant="body" style={[styles.unlockedBody, { color: colors.stone }]}>
                unlimited trips, photos, companions, memory books, and more — all yours.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.manageBtn, { borderColor: colors.mist }]}
              onPress={handleManagePurchase}
              activeOpacity={0.8}
            >
              <Feather name="credit-card" size={14} color={colors.stone} />
              <Text style={[styles.manageBtnText, { color: colors.stone }]}>
                manage purchase
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ---- Free state ---- */
          <>
            {/* Feature comparison */}
            <View style={styles.comparisonSection}>
              <View style={styles.comparisonHeader}>
                <Text variant="eyebrow" style={[styles.comparisonLabel, { color: colors.stone }]}>
                  feature
                </Text>
                <View style={styles.featureValues}>
                  <Text variant="eyebrow" style={[styles.comparisonLabel, { color: colors.stone }]}>
                    free
                  </Text>
                  <Text variant="eyebrow" style={[styles.comparisonLabel, { color: colors.coral }]}>
                    pro
                  </Text>
                </View>
              </View>

              <View style={[styles.comparisonCard, { backgroundColor: colors.pearl }]}>
                <FeatureRow label="active trips" free="1" pro="unlimited" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="items per trip" free="10" pro="unlimited" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="companions" free="2" pro="unlimited" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="photos per day" free="5" pro="unlimited" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="past trips" free="1" pro="all" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="memory book" free="—" pro="included" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="ai suggestions" free="—" pro="included" />
                <View style={[styles.separator, { backgroundColor: colors.mist }]} />
                <FeatureRow label="offline access" free="—" pro="included" />
              </View>
            </View>

            {/* Upgrade button */}
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.coral }]}
              onPress={() => router.push("/upgrade")}
              activeOpacity={0.85}
            >
              <Text style={styles.upgradeBtnText}>
                upgrade — ${PAID_PRICE} once
              </Text>
            </TouchableOpacity>

            <Text variant="caption" style={[styles.upgradeNote, { color: colors.sand }]}>
              one-time payment · no subscription · yours forever
            </Text>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    textAlign: "center",
  },

  /* Plan card */
  planCard: {
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 12,
  },
  planDesc: {
    lineHeight: 20,
  },

  /* Paid — unlocked */
  unlockedSection: {
    alignItems: "center",
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  unlockedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  unlockedTitle: {
    textAlign: "center",
  },
  unlockedBody: {
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
  },
  manageBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },

  /* Free — comparison */
  comparisonSection: {
    marginTop: spacing.xl,
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  comparisonLabel: {
    marginLeft: 4,
  },
  comparisonCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  featureLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
    flex: 1,
  },
  featureValues: {
    flexDirection: "row",
    gap: spacing.xl,
    minWidth: 140,
    justifyContent: "flex-end",
  },
  featureValue: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 12,
    width: 60,
    textAlign: "center",
  },
  proValue: {
    fontFamily: "InstrumentSans_500Medium",
  },

  /* Upgrade */
  upgradeBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  upgradeBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    color: "#fff",
  },
  upgradeNote: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
