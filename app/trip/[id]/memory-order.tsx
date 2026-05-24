import { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
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

const { width: SW } = Dimensions.get("window");

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    id: "digital",
    title: "digital book",
    price: "$39",
    priceNum: 39,
    icon: "smartphone" as const,
    features: [
      "full memory book unlocked",
      "swipe through on any device",
      "share link with your partner",
      "download as PDF",
    ],
    tag: null,
  },
  {
    id: "print",
    title: "printed + digital",
    price: "$79",
    priceNum: 79,
    icon: "book" as const,
    features: [
      "everything in digital, plus…",
      "soft-touch linen hardcover",
      "premium matte photo pages",
      "ships in 5–7 business days",
      "gift-ready packaging",
    ],
    tag: "most loved",
  },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function MemoryOrderScreen() {
  const colors = useColors();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [selected, setSelected] = useState<string>(type === "print" ? "print" : "digital");
  const [showShipping, setShowShipping] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Shipping fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");

  const plan = PLANS.find((p) => p.id === selected)!;
  const needsShipping = selected === "print";
  const shippingValid =
    !needsShipping || (name.trim() && address.trim() && city.trim() && zip.trim() && country.trim());

  async function handlePurchase() {
    if (!shippingValid) return;
    setProcessing(true);

    // Unlock the book
    await AsyncStorage.setItem(`memory_unlocked_${id}`, "true");

    // Save order details
    const order = {
      tripId: id,
      plan: selected,
      price: plan.priceNum,
      orderedAt: new Date().toISOString(),
      status: selected === "print" ? "processing" : "complete",
      shipping: needsShipping
        ? { name: name.trim(), address: address.trim(), city: city.trim(), zip: zip.trim(), country: country.trim() }
        : null,
    };

    const existing = await AsyncStorage.getItem("memory_orders");
    const orders = existing ? JSON.parse(existing) : [];
    orders.push(order);
    await AsyncStorage.setItem("memory_orders", JSON.stringify(orders));

    setTimeout(() => {
      router.replace(`/trip/${id}/memory-confirmation?plan=${selected}`);
    }, 1200);
  }

  if (!trip) return <Container logo><ActivityIndicator size="small" style={{ marginTop: 40 }} /></Container>;

  // If print is selected, show shipping form
  if (showShipping) {
    return (
      <Container logo>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setShowShipping(false)} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="eyebrow">shipping address</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.shippingScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.shippingIcon, { backgroundColor: colors.coral + "12" }]}>
            <Feather name="package" size={28} color={colors.coral} />
          </View>
          <Text style={[s.shippingTitle, { color: colors.ink }]}>where should we send it?</Text>
          <Text variant="caption" style={[s.shippingSub, { color: colors.stone }]}>
            soft-touch linen hardcover · ships in 5–7 days
          </Text>

          <View style={s.formGroup}>
            <Text style={[s.formLabel, { color: colors.stone }]}>full name</Text>
            <TextInput
              style={[s.formInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
              value={name}
              onChangeText={setName}
              placeholder="your name"
              placeholderTextColor={colors.sand}
            />
          </View>

          <View style={s.formGroup}>
            <Text style={[s.formLabel, { color: colors.stone }]}>street address</Text>
            <TextInput
              style={[s.formInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
              value={address}
              onChangeText={setAddress}
              placeholder="123 main street, apt 4"
              placeholderTextColor={colors.sand}
            />
          </View>

          <View style={s.formRow}>
            <View style={[s.formGroup, { flex: 1 }]}>
              <Text style={[s.formLabel, { color: colors.stone }]}>city</Text>
              <TextInput
                style={[s.formInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
                value={city}
                onChangeText={setCity}
                placeholder="city"
                placeholderTextColor={colors.sand}
              />
            </View>
            <View style={[s.formGroup, { width: 100 }]}>
              <Text style={[s.formLabel, { color: colors.stone }]}>zip code</Text>
              <TextInput
                style={[s.formInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
                value={zip}
                onChangeText={setZip}
                placeholder="10001"
                placeholderTextColor={colors.sand}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={[s.formLabel, { color: colors.stone }]}>country</Text>
            <TextInput
              style={[s.formInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
              value={country}
              onChangeText={setCountry}
              placeholder="united states"
              placeholderTextColor={colors.sand}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Pay button */}
        <View style={[s.bottomBar, { backgroundColor: colors.ivory, borderTopColor: colors.mist }]}>
          <TouchableOpacity
            style={[s.payBtn, { backgroundColor: colors.ink }, (!shippingValid || processing) && s.payBtnDisabled]}
            onPress={handlePurchase}
            activeOpacity={0.85}
            disabled={!shippingValid || processing}
          >
            {processing ? (
              <ActivityIndicator color={colors.pearl} size="small" />
            ) : (
              <>
                <Feather name="credit-card" size={15} color={colors.pearl} />
                <Text style={[s.payBtnText, { color: colors.pearl }]}>pay {plan.price}</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={s.secureRow}>
            <Feather name="lock" size={10} color={colors.sand} />
            <Text variant="caption" style={{ fontSize: 10, color: colors.sand }}>secure payment · cancel anytime</Text>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container logo>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">unlock your book</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={[s.heroIcon, { backgroundColor: colors.coral + "12" }]}>
            <Feather name="book-open" size={28} color={colors.coral} />
          </View>
          <Text style={[s.heroTitle, { color: colors.ink }]}>{trip.title.toLowerCase()}</Text>
          <Text variant="caption" style={{ marginTop: 6, color: colors.stone, textAlign: "center" }}>
            your complete memory book is ready
          </Text>
        </View>

        {/* Plan cards */}
        <View style={s.plansContainer}>
          {PLANS.map((p) => (
            <Pressable
              key={p.id}
              style={({ pressed }) => [
                s.planCard,
                { backgroundColor: colors.pearl, borderColor: colors.mist },
                selected === p.id && { borderColor: colors.coral, backgroundColor: colors.coral + "06" },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setSelected(p.id)}
            >
              {p.tag && (
                <View style={[s.planTag, { backgroundColor: colors.coral }]}>
                  <Text style={[s.planTagText, { color: colors.pearl }]}>{p.tag}</Text>
                </View>
              )}

              {/* Radio */}
              <View style={s.planTop}>
                <View style={[s.planRadio, { borderColor: colors.mist }]}>
                  {selected === p.id && <View style={[s.planRadioInner, { backgroundColor: colors.coral }]} />}
                </View>
                <View style={s.planTitleRow}>
                  <Feather
                    name={p.icon}
                    size={16}
                    color={selected === p.id ? colors.coral : colors.stone}
                  />
                  <Text style={[s.planTitle, { color: colors.ink }, selected === p.id && { color: colors.coral }]}>
                    {p.title}
                  </Text>
                </View>
                <Text style={[s.planPrice, { color: colors.stone }, selected === p.id && { color: colors.coral }]}>
                  {p.price}
                </Text>
              </View>

              {/* Features */}
              <View style={s.planFeatures}>
                {p.features.map((f, i) => (
                  <View key={i} style={s.featureRow}>
                    <Feather
                      name="check"
                      size={12}
                      color={selected === p.id ? colors.coral : colors.sand}
                    />
                    <Text variant="caption" style={{ color: colors.stone, fontSize: 12 }}>{f}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        {/* What's included */}
        <View style={s.includesSection}>
          <Text style={[s.includesTitle, { color: colors.ink }]}>what you get</Text>
          <View style={s.includesGrid}>
            {[
              { icon: "image" as const, label: "all your photos" },
              { icon: "edit-3" as const, label: "AI-written stories" },
              { icon: "map-pin" as const, label: "places & maps" },
              { icon: "bar-chart-2" as const, label: "trip stats" },
            ].map((item) => (
              <View key={item.label} style={s.includesItem}>
                <View style={[s.includesIconWrap, { backgroundColor: colors.coral + "10" }]}>
                  <Feather name={item.icon} size={14} color={colors.coral} />
                </View>
                <Text variant="caption" style={{ fontSize: 10, color: colors.stone, textAlign: "center" }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { backgroundColor: colors.ivory, borderTopColor: colors.mist }]}>
        <TouchableOpacity
          style={[s.payBtn, { backgroundColor: colors.ink }, processing && s.payBtnDisabled]}
          onPress={() => {
            if (needsShipping) {
              setShowShipping(true);
            } else {
              handlePurchase();
            }
          }}
          activeOpacity={0.85}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={colors.pearl} size="small" />
          ) : (
            <>
              <Feather name={needsShipping ? "truck" : "credit-card"} size={15} color={colors.pearl} />
              <Text style={[s.payBtnText, { color: colors.pearl }]}>
                {needsShipping ? `continue · ${plan.price}` : `unlock · ${plan.price}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <View style={s.secureRow}>
          <Feather name="lock" size={10} color={colors.sand} />
          <Text variant="caption" style={{ fontSize: 10, color: colors.sand }}>secure payment · cancel anytime</Text>
        </View>
      </View>
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

  /* Hero */
  hero: { alignItems: "center", marginBottom: spacing.xl },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 28,
    textAlign: "center",
  },

  /* Plan cards */
  plansContainer: { gap: 12 },
  planCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    overflow: "hidden",
  },
  planTag: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  planTagText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  planTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 15,
  },
  planPrice: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 26,
  },
  planFeatures: {
    marginTop: 12,
    marginLeft: 32,
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* Includes */
  includesSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  includesTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    marginBottom: 16,
  },
  includesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  includesItem: { alignItems: "center", width: (SW - spacing.lg * 2 - 48) / 4 },
  includesIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  /* Bottom bar */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: "100%",
  },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  /* Shipping form */
  shippingScroll: { paddingBottom: 40 },
  shippingIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    marginTop: spacing.md,
  },
  shippingTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 24,
    textAlign: "center",
  },
  shippingSub: {
    textAlign: "center",
    marginBottom: spacing.xl,
    marginTop: 6,
  },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: "row", gap: 12 },
  formLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 2,
  },
  formInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 14,
  },
});
