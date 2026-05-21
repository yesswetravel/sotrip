import { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text } from "../../features/design-system";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { APP_NAME } from "../../theme/brand";

const { width: SCREEN_W } = Dimensions.get("window");

type PlanId = "monthly" | "yearly";

const PLANS: { id: PlanId; label: string; price: string; perMonth: string; badge?: string }[] = [
  {
    id: "yearly",
    label: "yearly",
    price: "$49.99/year",
    perMonth: "$4.17/mo",
    badge: "best value",
  },
  {
    id: "monthly",
    label: "monthly",
    price: "$7.99/month",
    perMonth: "$7.99/mo",
  },
];

const FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; desc: string }[] = [
  {
    icon: "map",
    title: "unlimited trips",
    desc: "plan as many trips as you want with day-by-day itineraries",
  },
  {
    icon: "camera",
    title: "photo journals",
    desc: "save and organise trip photos into beautiful galleries",
  },
  {
    icon: "book-open",
    title: "memory books",
    desc: "auto-generated keepsake books from your trips",
  },
  {
    icon: "users",
    title: "travel mates",
    desc: "invite friends to plan and share trips together",
  },
  {
    icon: "check-square",
    title: "packing & budgets",
    desc: "smart packing lists, budget tracking, and documents",
  },
  {
    icon: "compass",
    title: "place discovery",
    desc: "search and save places from google, pinterest, and more",
  },
];

const SUB_KEY = "@subscription_status";

export default function PaywallScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId>("yearly");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    // Simulate purchase — in production this would use RevenueCat
    await new Promise((r) => setTimeout(r, 1200));
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify({
      plan: selected,
      subscribedAt: new Date().toISOString(),
      status: "active",
    }));
    setLoading(false);
    router.replace("/");
  }

  async function handleRestore() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    // Check if there's a saved subscription
    const saved = await AsyncStorage.getItem(SUB_KEY);
    if (saved) {
      router.replace("/");
    } else {
      setLoading(false);
    }
  }

  async function handleFreeTrial() {
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify({
      plan: "trial",
      subscribedAt: new Date().toISOString(),
      trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "trial",
    }));
    router.replace("/");
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={styles.brandName}>{APP_NAME}</Text>
          <Text variant="display" style={styles.headline}>
            your journey{"\n"}starts here
          </Text>
          <Text style={styles.subheadline}>
            unlock everything with a subscription
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text variant="eyebrow" style={styles.featuresLabel}>everything included</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon} size={16} color={colors.teal} />
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text variant="eyebrow" style={styles.plansLabel}>choose your plan</Text>
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelected(plan.id)}
                activeOpacity={0.8}
              >
                {/* Radio */}
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                {/* Plan info */}
                <View style={styles.planBody}>
                  <View style={styles.planNameRow}>
                    <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                      {plan.label}
                    </Text>
                    {plan.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{plan.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>

                {/* Per month */}
                <Text style={[styles.planPer, isSelected && styles.planPerSelected]}>
                  {plan.perMonth}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Free trial note */}
        <View style={styles.trialNote}>
          <Feather name="gift" size={14} color={colors.gold} />
          <Text style={styles.trialNoteText}>
            7-day free trial included — cancel anytime
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA — fixed */}
      <View style={styles.bottomCta}>
        <TouchableOpacity
          style={[styles.subscribeBtn, loading && styles.btnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.subscribeBtnText}>
            {loading ? "processing..." : "start free trial"}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomLinks}>
          <TouchableOpacity onPress={handleRestore} activeOpacity={0.7}>
            <Text style={styles.bottomLink}>restore purchases</Text>
          </TouchableOpacity>
          <Text style={styles.bottomDot}>·</Text>
          <TouchableOpacity onPress={handleFreeTrial} activeOpacity={0.7}>
            <Text style={styles.bottomLink}>skip for now</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legalText}>
          payment will be charged after the 7-day trial.{"\n"}
          auto-renews unless cancelled 24 hours before.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 220,
  },

  /* Header */
  headerArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: spacing.xl,
  },
  brandName: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 14,
    color: colors.stone,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  headline: {
    fontSize: 32,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    color: colors.stone,
    textAlign: "center",
  },

  /* Features */
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresLabel: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal + "10",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureBody: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  featureTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.ink,
  },
  featureDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.stone,
    lineHeight: 17,
  },

  /* Plans */
  plansSection: {
    marginBottom: spacing.md,
  },
  plansLabel: {
    marginBottom: spacing.sm,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.pearl,
    borderWidth: 1.5,
    borderColor: colors.mist,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  planCardSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coral + "06",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.coral,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coral,
  },
  planBody: {
    flex: 1,
    gap: 2,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.ink,
    textTransform: "capitalize",
  },
  planNameSelected: {
    color: colors.coral,
  },
  badge: {
    backgroundColor: colors.gold + "18",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planPrice: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.stone,
  },
  planPer: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.stone,
  },
  planPerSelected: {
    color: colors.coral,
  },

  /* Trial note */
  trialNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.gold + "0D",
    borderWidth: 1,
    borderColor: colors.gold + "20",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  trialNoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.gold,
  },

  /* Bottom CTA */
  bottomCta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mist,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  subscribeBtn: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  subscribeBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.pearl,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  bottomLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  bottomLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.stone,
  },
  bottomDot: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.sand,
  },
  legalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: colors.sand,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 10,
  },
});
