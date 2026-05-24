import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
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
  const colors = useColors();
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

  if (!trip || !order) return <Container logo><ActivityIndicator size="small" style={{ marginTop: 40 }} /></Container>;

  const currentStepIndex = STATUS_ORDER.indexOf(order.trackingStatus ?? "processing");
  const orderDate = new Date(order.orderedAt);
  const estimatedDate = new Date(orderDate);
  estimatedDate.setDate(estimatedDate.getDate() + 7);

  return (
    <Container logo>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">order tracking</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Book info */}
        <View style={[s.bookCard, { backgroundColor: colors.pearl }]}>
          <View style={[s.bookIconWrap, { backgroundColor: colors.coral + "12" }]}>
            <Feather name="book" size={22} color={colors.coral} />
          </View>
          <View style={s.bookInfo}>
            <Text style={[s.bookTitle, { color: colors.ink }]}>{trip.title.toLowerCase()}</Text>
            <Text variant="caption" style={{ fontSize: 11, color: colors.stone }}>
              printed + digital · {orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
          <Text style={[s.bookPrice, { color: colors.ink }]}>${order.price}</Text>
        </View>

        {/* Estimated delivery */}
        <View style={[s.deliveryCard, { backgroundColor: colors.teal + "0A", borderColor: colors.teal + "20" }]}>
          <Feather name="calendar" size={14} color={colors.teal} />
          <View style={s.deliveryInfo}>
            <Text style={[s.deliveryLabel, { color: colors.teal }]}>estimated delivery</Text>
            <Text style={[s.deliveryDate, { color: colors.ink }]}>
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
                      { backgroundColor: colors.mist },
                      isComplete && { backgroundColor: colors.teal },
                      isCurrent && { backgroundColor: colors.coral },
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
                        { backgroundColor: colors.mist },
                        isComplete && i < currentStepIndex && { backgroundColor: colors.teal },
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View style={[s.timelineContent, isLast && { paddingBottom: 0 }]}>
                  <Text
                    style={[
                      s.stepLabel,
                      { color: colors.sand },
                      isComplete && { color: colors.ink },
                      isCurrent && { color: colors.coral },
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text variant="caption" style={[s.stepDesc, { color: colors.stone }]}>{step.desc}</Text>
                  {isCurrent && (
                    <View style={[s.currentBadge, { backgroundColor: colors.coral + "12" }]}>
                      <View style={[s.currentDot, { backgroundColor: colors.coral }]} />
                      <Text style={[s.currentText, { color: colors.coral }]}>in progress</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Shipping address */}
        {order.shipping && (
          <View style={[s.addressCard, { backgroundColor: colors.pearl }]}>
            <Text style={[s.addressTitle, { color: colors.sand }]}>shipping to</Text>
            <Text style={[s.addressLine, { color: colors.ink }]}>{order.shipping.name}</Text>
            <Text variant="caption" style={{ fontSize: 12, color: colors.stone }}>
              {order.shipping.address}
            </Text>
            <Text variant="caption" style={{ fontSize: 12, color: colors.stone }}>
              {order.shipping.city}, {order.shipping.zip}
            </Text>
            <Text variant="caption" style={{ fontSize: 12, color: colors.stone }}>
              {order.shipping.country}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.ink }]}
            activeOpacity={0.85}
            onPress={() => router.push(`/trip/${id}/memory`)}
          >
            <Feather name="book-open" size={15} color={colors.pearl} />
            <Text style={[s.primaryBtnText, { color: colors.pearl }]}>view digital book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => goBack(router)}
          >
            <Text style={[s.secondaryBtnText, { color: colors.stone }]}>back</Text>
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scroll: { paddingBottom: 40 },

  /* Book card */
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  bookIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookInfo: { flex: 1, gap: 2 },
  bookTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
  },
  bookPrice: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 16,
  },

  /* Delivery estimate */
  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: spacing.xl,
  },
  deliveryInfo: { flex: 1, gap: 2 },
  deliveryLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  deliveryDate: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
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
    alignItems: "center",
    justifyContent: "center",
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 28,
  },
  stepLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  stepDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  },
  currentText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 10,
  },

  /* Address */
  addressCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: spacing.xl,
  },
  addressTitle: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  addressLine: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    marginBottom: 2,
  },

  /* Actions */
  actions: { gap: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 15,
  },
  primaryBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
  },
});
