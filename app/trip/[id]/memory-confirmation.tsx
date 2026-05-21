import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

const { width: SW } = Dimensions.get("window");

export default function MemoryConfirmationScreen() {
  const { id, plan } = useLocalSearchParams<{ id: string; plan?: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);
  const isPrint = plan === "print";

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!trip) return null;

  return (
    <Container>
      <View style={s.container}>
        {/* Animated hero */}
        <Animated.View
          style={[
            s.hero,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Success circle */}
          <View style={s.successCircle}>
            <View style={s.successInner}>
              <Feather name="check" size={32} color={colors.pearl} />
            </View>
          </View>

          <Text style={s.title}>
            {isPrint ? "order placed!" : "book unlocked!"}
          </Text>
          <Text style={s.subtitle}>{trip.title.toLowerCase()}</Text>
          <Text variant="caption" style={s.desc}>
            {isPrint
              ? "your printed memory book is on its way"
              : "your full memory book is now available"}
          </Text>
        </Animated.View>

        {/* Order summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>order summary</Text>
          <View style={s.summaryDivider} />

          <View style={s.summaryRow}>
            <Text variant="caption" style={s.summaryLabel}>plan</Text>
            <Text style={s.summaryValue}>
              {isPrint ? "printed + digital" : "digital book"}
            </Text>
          </View>

          <View style={s.summaryRow}>
            <Text variant="caption" style={s.summaryLabel}>total</Text>
            <Text style={s.summaryValue}>{isPrint ? "$79" : "$39"}</Text>
          </View>

          {isPrint && (
            <>
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}>
                <Text variant="caption" style={s.summaryLabel}>shipping</Text>
                <Text style={s.summaryValue}>5–7 business days</Text>
              </View>
              <View style={s.summaryRow}>
                <Text variant="caption" style={s.summaryLabel}>status</Text>
                <View style={s.statusBadge}>
                  <View style={s.statusDot} />
                  <Text style={s.statusText}>processing</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* What's next */}
        <View style={s.nextSection}>
          <Text style={s.nextTitle}>what's next</Text>
          <View style={s.nextList}>
            <View style={s.nextItem}>
              <View style={s.nextIconWrap}>
                <Feather name="book-open" size={14} color={colors.coral} />
              </View>
              <Text variant="caption" style={s.nextText}>
                view your full memory book anytime
              </Text>
            </View>
            <View style={s.nextItem}>
              <View style={s.nextIconWrap}>
                <Feather name="share-2" size={14} color={colors.coral} />
              </View>
              <Text variant="caption" style={s.nextText}>
                share it with your travel partner
              </Text>
            </View>
            {isPrint && (
              <View style={s.nextItem}>
                <View style={s.nextIconWrap}>
                  <Feather name="package" size={14} color={colors.coral} />
                </View>
                <Text variant="caption" style={s.nextText}>
                  track your print order in my books
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.replace(`/trip/${id}/memory`)}
          >
            <Feather name="book-open" size={15} color={colors.pearl} />
            <Text style={s.primaryBtnText}>view memory book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.replace(`/trip/${id}`)}
          >
            <Text style={s.secondaryBtnText}>back to trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },

  /* Hero */
  hero: { alignItems: "center", marginBottom: spacing.xl },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.coral + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 30,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    color: colors.stone,
    marginTop: 2,
  },
  desc: {
    color: colors.stone,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  /* Summary card */
  summaryCard: {
    backgroundColor: colors.pearl,
    borderRadius: 14,
    padding: 18,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: colors.sand,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mist,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: { color: colors.stone },
  summaryValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.coral + "12",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: colors.coral,
  },

  /* What's next */
  nextSection: { marginBottom: spacing.xl },
  nextTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    color: colors.ink,
    marginBottom: 14,
  },
  nextList: { gap: 10 },
  nextItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nextIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.coral + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: colors.stone, flex: 1 },

  /* Actions */
  actions: {
    paddingBottom: 28,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.stone,
  },
});
