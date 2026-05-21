import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Tracking steps                                                     */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    id: "confirmed",
    label: "order confirmed",
    desc: "your memory book order has been received",
    icon: "check-circle" as const,
  },
  {
    id: "processing",
    label: "preparing your book",
    desc: "AI is laying out your photos & stories",
    icon: "cpu" as const,
  },
  {
    id: "printing",
    label: "printing",
    desc: "premium matte pages on soft-touch linen",
    icon: "printer" as const,
  },
  {
    id: "shipped",
    label: "shipped",
    desc: "on its way to you",
    icon: "truck" as const,
  },
  {
    id: "delivered",
    label: "delivered",
    desc: "enjoy your memory book!",
    icon: "package" as const,
  },
];

const STATUS_ORDER = ["confirmed", "processing", "printing", "shipped", "delivered"];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function MemoryTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("memory_orders").then((val) => {
      if (!val) return;
      const orders = JSON.parse(val);
      const found = orders.find((o: any) => o.tripId === id && o.plan === "print");
      if (found) {
        if (!found.trackingStatus) found.trackingStatus = "processing";
        setOrder(found);
      }
    });
  }, [id]);

  if (!trip || !order) return null;

  const currentStepIndex = STATUS_ORDER.indexOf(order.trackingStatus ?? "processing");
  const orderDate = new Date(order.orderedAt);
  const estimatedDate = new Date(orderDate);
  estimatedDate.setDate(estimatedDate.getDate() + 7);

  return (
    <Container>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={20} color={colors.stone} />
        </TouchableOpacity>
        <Text variant="eyebrow" style={s.headerLabel}>order tracking</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Book info */}
        <View style={s.bookCard}>
          <View style={s.bookIconWrap}>
            <Feather name="book" size={22} color={colors.coral} />
          </View>
          <View style={s.bookInfo}>
            <Text style={s.bookTitle}>{trip.title.toLowerCase()}</Text>
            <Text variant="caption" style={s.bookMeta}>
              printed + digital · {orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
          <Text style={s.bookPrice}>${order.price}</Text>
        </View>

        {/* Estimated delivery */}
        <View style={s.deliveryCard}>
          <Feather name="calendar" size={14} color={colors.teal} />
          <View style={s.deliveryInfo}>
            <Text style={s.deliveryLabel}>estimated delivery</Text>
            <Text style={s.deliveryDate}>
              {estimatedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Tracking timeline */}
        <View style={s.timeline}>
          {STEPS.map((step, i) => {
            const isComplete = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isLast = i === STEPS.length - 1;

            return (
              <View key={step.id} style={s.timelineStep}>
                {/* Line + dot */}
                <View style={s.timelineLine}>
                  <View
                    style={[
                      s.timelineDot,
                      isComplete && s.timelineDotComplete,
                      isCurrent && s.timelineDotCurrent,
                    ]}
                  >
                    {isComplete ? (
                      <Feather name="check" size={10} color={colors.pearl} />
                    ) : (
                      <Feather name={step.icon} size={10} color={colors.sand} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        s.timelineConnector,
                        isComplete && i < currentStepIndex && s.timelineConnectorComplete,
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View style={[s.timelineContent, isLast && { paddingBottom: 0 }]}>
                  <Text
                    style={[
                      s.stepLabel,
                      isComplete && s.stepLabelComplete,
                      isCurrent && s.stepLabelCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text variant="caption" style={s.stepDesc}>{step.desc}</Text>
                  {isCurrent && (
                    <View style={s.currentBadge}>
                      <View style={s.currentDot} />
                      <Text style={s.currentText}>in progress</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Shipping address */}
        {order.shipping && (
          <View style={s.addressCard}>
            <Text style={s.addressTitle}>shipping to</Text>
            <Text style={s.addressLine}>{order.shipping.name}</Text>
            <Text variant="caption" style={s.addressDetail}>
              {order.shipping.address}
            </Text>
            <Text variant="caption" style={s.addressDetail}>
              {order.shipping.city}, {order.shipping.zip}
            </Text>
            <Text variant="caption" style={s.addressDetail}>
              {order.shipping.country}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/trip/${id}/memory`)}
          >
            <Feather name="book-open" size={15} color={colors.pearl} />
            <Text style={s.primaryBtnText}>view digital book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={s.secondaryBtnText}>back</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerLabel: { color: colors.stone },
  scroll: { paddingBottom: 40 },

  /* Book card */
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.pearl,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  bookIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.coral + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  bookInfo: { flex: 1, gap: 2 },
  bookTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    color: colors.ink,
  },
  bookMeta: { fontSize: 11, color: colors.stone },
  bookPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },

  /* Delivery estimate */
  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.teal + "0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.teal + "20",
    padding: 14,
    marginBottom: spacing.xl,
  },
  deliveryInfo: { flex: 1, gap: 2 },
  deliveryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: colors.teal,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  deliveryDate: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
    color: colors.ink,
  },

  /* Timeline */
  timeline: { marginBottom: spacing.xl },
  timelineStep: {
    flexDirection: "row",
  },
  timelineLine: {
    alignItems: "center",
    width: 28,
    marginRight: 14,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotComplete: {
    backgroundColor: colors.teal,
  },
  timelineDotCurrent: {
    backgroundColor: colors.coral,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.mist,
    marginVertical: 4,
  },
  timelineConnectorComplete: {
    backgroundColor: colors.teal,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 28,
  },
  stepLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.sand,
  },
  stepLabelComplete: { color: colors.ink },
  stepLabelCurrent: { color: colors.coral },
  stepDesc: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.coral + "12",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  currentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: colors.coral,
  },

  /* Address */
  addressCard: {
    backgroundColor: colors.pearl,
    borderRadius: 14,
    padding: 16,
    marginBottom: spacing.xl,
  },
  addressTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: colors.sand,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  addressLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  addressDetail: { fontSize: 12, color: colors.stone },

  /* Actions */
  actions: { gap: 10 },
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
