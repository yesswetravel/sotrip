import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../../features/design-system";
import { useSubscriptionStore } from "../../features/subscription/store";
import { PAID_PRICE } from "../../features/subscription/constants";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { APP_NAME } from "../../theme/brand";

const FEATURES = [
  { icon: "✦", title: "unlimited trips", desc: "plan every journey, big or small" },
  { icon: "◈", title: "unlimited activities", desc: "no cap on places & things to do" },
  { icon: "❋", title: "memories forever", desc: "every past trip archived & searchable" },
  { icon: "◎", title: "invite everyone", desc: "plan together with unlimited companions" },
  { icon: "▣", title: "offline access", desc: "your itinerary works without signal" },
];

export default function PaywallScreen() {
  const colors = useColors();
  const router = useRouter();
  const setTier = useSubscriptionStore((s) => s.setTier);
  const markPaywallSeen = useSubscriptionStore((s) => s.markPaywallSeen);

  function handleStartFree() {
    setTier("free");
    markPaywallSeen();
    router.replace("/");
  }

  function handleUnlock() {
    setTier("paid");
    markPaywallSeen();
    router.replace("/");
  }

  function handleRestore() {
    // RevenueCat restore will go here later
    handleUnlock();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.ivory }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="eyebrow">{APP_NAME}</Text>
        <Text variant="display" style={styles.headline}>
          unlock everything
        </Text>
        <Text variant="titleItalic" style={[styles.subtitle, { color: colors.stone }]}>
          plan beautifully, remember forever
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <Text style={[styles.featureIcon, { color: colors.taupe }]}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text variant="body" style={styles.featureTitle}>
                {f.title}
              </Text>
              <Text variant="caption">{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.priceSection}>
        <Text variant="display" style={[styles.priceAmount, { color: colors.ink }]}>
          ${PAID_PRICE}
        </Text>
        <Text variant="caption" style={[styles.priceLabel, { color: colors.stone }]}>
          one-time purchase — yours forever
        </Text>
      </View>

      <View style={[styles.freeNote, { backgroundColor: colors.mist }]}>
        <Text variant="caption" style={styles.freeNoteText}>
          the free plan includes 1 active trip, 10 activities per trip,{"\n"}
          and your most recent past trip — enough to start exploring.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.unlockBtn, { backgroundColor: colors.ink }]}
        onPress={handleUnlock}
        activeOpacity={0.85}
      >
        <Text variant="body" style={[styles.unlockBtnText, { color: colors.ivory }]}>
          unlock — ${PAID_PRICE} once
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.freeBtn, { borderColor: colors.sand }]}
        onPress={handleStartFree}
        activeOpacity={0.85}
      >
        <Text variant="body" style={[styles.freeBtnText, { color: colors.stone }]}>
          start free
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRestore} activeOpacity={0.8}>
        <Text variant="caption" style={[styles.restore, { color: colors.stone }]}>
          restore purchases
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  headline: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  features: {
    gap: 20,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  featureIcon: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: "InstrumentSans_500Medium",
  },
  priceSection: {
    alignItems: "center",
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  priceAmount: {
    fontSize: 42,
    lineHeight: 52,
    textAlign: "center",
  },
  priceLabel: {
    marginTop: 6,
  },
  freeNote: {
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  freeNoteText: {
    textAlign: "center",
    lineHeight: 18,
  },
  unlockBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  unlockBtnText: {
    fontFamily: "InstrumentSans_500Medium",
  },
  freeBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  freeBtnText: {
    fontFamily: "InstrumentSans_500Medium",
  },
  restore: {
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
