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
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

const { width: SW } = Dimensions.get("window");

export default function MemoryConfirmationScreen() {
  const colors = useColors();
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
    <Container logo>
      <View style={s.container}>
        {/* Animated hero */}
        <Animated.View
          style={[
            s.hero,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Success circle */}
          <View style={[s.successCircle, { backgroundColor: colors.coral + "15" }]}>
            <View style={[s.successInner, { backgroundColor: colors.coral }]}>
              <Feather name="check" size={32} color={colors.pearl} />
            </View>
          </View>

          <Text style={[s.title, { color: colors.ink }]}>
            {isPrint ? "order placed!" : "book unlocked!"}
          </Text>
          <Text style={[s.subtitle, { color: colors.stone }]}>{trip.title.toLowerCase()}</Text>
          <Text variant="caption" style={[s.desc, { color: colors.stone }]}>
            {isPrint
              ? "your printed memory book is on its way"
              : "your full memory book is now available"}
          </Text>
        </Animated.View>

        {/* Order summary */}
        <View style={[s.summaryCard, { backgroundColor: colors.pearl }]}>
          <Text style={[s.summaryTitle, { color: colors.sand }]}>order summary</Text>
          <View style={[s.summaryDivider, { backgroundColor: colors.mist }]} />

          <View style={s.summaryRow}>
            <Text variant="caption" style={{ color: colors.stone }}>plan</Text>
            <Text style={[s.summaryValue, { color: colors.ink }]}>
              {isPrint ? "printed + digital" : "digital book"}
            </Text>
          </View>

          <View style={s.summaryRow}>
            <Text variant="caption" style={{ color: colors.stone }}>total</Text>
            <Text style={[s.summaryValue, { color: colors.ink }]}>{isPrint ? "$79" : "$39"}</Text>
          </View>

          {isPrint && (
            <>
              <View style={[s.summaryDivider, { backgroundColor: colors.mist }]} />
              <View style={s.summaryRow}>
                <Text variant="caption" style={{ color: colors.stone }}>shipping</Text>
                <Text style={[s.summaryValue, { color: colors.ink }]}>5–7 business days</Text>
              </View>
              <View style={s.summaryRow}>
                <Text variant="caption" style={{ color: colors.stone }}>status</Text>
                <View style={[s.statusBadge, { backgroundColor: colors.coral + "12" }]}>
                  <View style={[s.statusDot, { backgroundColor: colors.coral }]} />
                  <Text style={[s.statusText, { color: colors.coral }]}>processing</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* What's next */}
        <View style={s.nextSection}>
          <Text style={[s.nextTitle, { color: colors.ink }]}>what's next</Text>
          <View style={s.nextList}>
            <View style={s.nextItem}>
              <View style={[s.nextIconWrap, { backgroundColor: colors.coral + "10" }]}>
                <Feather name="book-open" size={14} color={colors.coral} />
              </View>
              <Text variant="caption" style={{ color: colors.stone, flex: 1 }}>
                view your full memory book anytime
              </Text>
            </View>
            <View style={s.nextItem}>
              <View style={[s.nextIconWrap, { backgroundColor: colors.coral + "10" }]}>
                <Feather name="share-2" size={14} color={colors.coral} />
              </View>
              <Text variant="caption" style={{ color: colors.stone, flex: 1 }}>
                share it with your travel partner
              </Text>
            </View>
            {isPrint && (
              <View style={s.nextItem}>
                <View style={[s.nextIconWrap, { backgroundColor: colors.coral + "10" }]}>
                  <Feather name="package" size={14} color={colors.coral} />
                </View>
                <Text variant="caption" style={{ color: colors.stone, flex: 1 }}>
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
            style={[s.primaryBtn, { backgroundColor: colors.ink }]}
            activeOpacity={0.85}
            onPress={() => router.replace(`/trip/${id}/memory`)}
          >
            <Feather name="book-open" size={15} color={colors.pearl} />
            <Text style={[s.primaryBtnText, { color: colors.pearl }]}>view memory book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.replace(`/trip/${id}`)}
          >
            <Text style={[s.secondaryBtnText, { color: colors.stone }]}>back to trip</Text>
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 30,
  },
  subtitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    marginTop: 2,
  },
  desc: {
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  /* Summary card */
  summaryCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },

  /* What's next */
  nextSection: { marginBottom: spacing.xl },
  nextTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
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
    alignItems: "center",
    justifyContent: "center",
  },

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
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
