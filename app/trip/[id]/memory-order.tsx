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
import { useTrip } from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
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

  if (!trip) return null;

  // If print is selected, show shipping form
  if (showShipping) {
    return (
      <Container>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setShowShipping(false)} hitSlop={12}>
            <Feather name="chevron-left" size={20} color={colors.stone} />
          </TouchableOpacity>
          <Text variant="eyebrow" style={s.headerLabel}>shipping address</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.shippingScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.shippingIcon}>
            <Feather name="package" size={28} color={colors.coral} />
          </View>
          <Text style={s.shippingTitle}>where should we send it?</Text>
          <Text variant="caption" style={s.shippingSub}>
            soft-touch linen hardcover · ships in 5–7 days
          </Text>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>full name</Text>
            <TextInput
              style={s.formInput}
              value={name}
              onChangeText={setName}
              placeholder="your name"
              placeholderTextColor={colors.sand}
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>street address</Text>
            <TextInput
              style={s.formInput}
              value={address}
              onChangeText={setAddress}
              placeholder="123 main street, apt 4"
              placeholderTextColor={colors.sand}
            />
          </View>

          <View style={s.formRow}>
            <View style={[s.formGroup, { flex: 1 }]}>
              <Text style={s.formLabel}>city</Text>
              <TextInput
                style={s.formInput}
                value={city}
                onChangeText={setCity}
                placeholder="city"
                placeholderTextColor={colors.sand}
              />
            </View>
            <View style={[s.formGroup, { width: 100 }]}>
              <Text style={s.formLabel}>zip code</Text>
              <TextInput
                style={s.formInput}
                value={zip}
                onChangeText={setZip}
                placeholder="10001"
                placeholderTextColor={colors.sand}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={s.formLabel}>country</Text>
            <TextInput
              style={s.formInput}
              value={country}
              onChangeText={setCountry}
              placeholder="united states"
              placeholderTextColor={colors.sand}
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Pay button */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.payBtn, (!shippingValid || processing) && s.payBtnDisabled]}
            onPress={handlePurchase}
            activeOpacity={0.85}
            disabled={!shippingValid || processing}
          >
            {processing ? (
              <ActivityIndicator color={colors.pearl} size="small" />
            ) : (
              <>
                <Feather name="credit-card" size={15} color={colors.pearl} />
                <Text style={s.payBtnText}>pay {plan.price}</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={s.secureRow}>
            <Feather name="lock" size={10} color={colors.sand} />
            <Text variant="caption" style={s.secureText}>secure payment · cancel anytime</Text>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={20} color={colors.stone} />
        </TouchableOpacity>
        <Text variant="eyebrow" style={s.headerLabel}>unlock your book</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Feather name="book-open" size={28} color={colors.coral} />
          </View>
          <Text style={s.heroTitle}>{trip.title.toLowerCase()}</Text>
          <Text variant="caption" style={s.heroSub}>
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
                selected === p.id && s.planCardSelected,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => setSelected(p.id)}
            >
              {p.tag && (
                <View style={s.planTag}>
                  <Text style={s.planTagText}>{p.tag}</Text>
                </View>
              )}

              {/* Radio */}
              <View style={s.planTop}>
                <View style={s.planRadio}>
                  {selected === p.id && <View style={s.planRadioInner} />}
                </View>
                <View style={s.planTitleRow}>
                  <Feather
                    name={p.icon}
                    size={16}
                    color={selected === p.id ? colors.coral : colors.stone}
                  />
                  <Text style={[s.planTitle, selected === p.id && s.planTitleActive]}>
                    {p.title}
                  </Text>
                </View>
                <Text style={[s.planPrice, selected === p.id && s.planPriceActive]}>
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
                    <Text variant="caption" style={s.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        {/* What's included */}
        <View style={s.includesSection}>
          <Text style={s.includesTitle}>what you get</Text>
          <View style={s.includesGrid}>
            {[
              { icon: "image" as const, label: "all your photos" },
              { icon: "edit-3" as const, label: "AI-written stories" },
              { icon: "map-pin" as const, label: "places & maps" },
              { icon: "bar-chart-2" as const, label: "trip stats" },
            ].map((item) => (
              <View key={item.label} style={s.includesItem}>
                <View style={s.includesIconWrap}>
                  <Feather name={item.icon} size={14} color={colors.coral} />
                </View>
                <Text variant="caption" style={s.includesLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.payBtn, processing && s.payBtnDisabled]}
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
              <Text style={s.payBtnText}>
                {needsShipping ? `continue · ${plan.price}` : `unlock · ${plan.price}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <View style={s.secureRow}>
          <Feather name="lock" size={10} color={colors.sand} />
          <Text variant="caption" style={s.secureText}>secure payment · cancel anytime</Text>
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerLabel: { color: colors.stone },
  scroll: { paddingBottom: 40 },

  /* Hero */
  hero: { alignItems: "center", marginBottom: spacing.xl },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.coral + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 28,
    color: colors.ink,
    textAlign: "center",
  },
  heroSub: {
    marginTop: 6,
    color: colors.stone,
    textAlign: "center",
  },

  /* Plan cards */
  plansContainer: { gap: 12 },
  planCard: {
    backgroundColor: colors.pearl,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.mist,
    padding: 16,
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coral + "06",
  },
  planTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.coral,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  planTagText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: colors.pearl,
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
    borderColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coral,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  planTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.ink,
  },
  planTitleActive: { color: colors.coral },
  planPrice: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 26,
    color: colors.stone,
  },
  planPriceActive: { color: colors.coral },
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
  featureText: { color: colors.stone, fontSize: 12 },

  /* Includes */
  includesSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  includesTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    color: colors.ink,
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
    backgroundColor: colors.coral + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  includesLabel: { fontSize: 10, color: colors.stone, textAlign: "center" },

  /* Bottom bar */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: colors.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mist,
    alignItems: "center",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: "100%",
  },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
    letterSpacing: 0.3,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  secureText: { fontSize: 10, color: colors.sand },

  /* Shipping form */
  shippingScroll: { paddingBottom: 40 },
  shippingIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.coral + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    marginTop: spacing.md,
  },
  shippingTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 24,
    color: colors.ink,
    textAlign: "center",
  },
  shippingSub: {
    textAlign: "center",
    color: colors.stone,
    marginBottom: spacing.xl,
    marginTop: 6,
  },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: "row", gap: 12 },
  formLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: colors.stone,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 2,
  },
  formInput: {
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.ink,
  },
});
