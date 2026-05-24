import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

/* Enable LayoutAnimation on Android */
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "how do I create a trip?",
    answer:
      "tap the + button on the trips tab, enter your destination and dates, and we'll set up your day-by-day itinerary.",
  },
  {
    question: "can I plan with my partner?",
    answer:
      "yes! open any trip, tap 'travel mates' and share the invite link with your partner.",
  },
  {
    question: "what's included in the free plan?",
    answer:
      "the free plan includes 1 active trip, 10 activities per trip, and your most recent past trip.",
  },
  {
    question: "how do I upgrade to pro?",
    answer:
      "go to settings → your plan and tap upgrade. it's a one-time purchase of $4.99, yours forever.",
  },
  {
    question: "how do photos work?",
    answer:
      "tap the photos tab to capture moments during your trip. photos are organized by day automatically.",
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ row component                                                  */
/* ------------------------------------------------------------------ */

function FaqRow({
  item,
  expanded,
  onToggle,
  colors,
}: {
  item: FaqItem;
  expanded: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.faqCard,
        { backgroundColor: colors.pearl, borderColor: colors.mist },
      ]}
    >
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestion, { color: colors.ink }]}>
          {item.question}
        </Text>
        <View
          style={[
            styles.chevronCircle,
            { backgroundColor: colors.coral + "14" },
          ]}
        >
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.coral}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.faqBody, { borderTopColor: colors.mist }]}>
          <Text style={[styles.faqAnswer, { color: colors.stone }]}>
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

export default function HelpScreen() {
  const colors = useColors();
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = useCallback(
    (index: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedIndex((prev) => (prev === index ? null : index));
    },
    []
  );

  function handleContactUs() {
    Linking.openURL("mailto:hello@sotrip.app");
  }

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBack(router, "/(tabs)/profile")}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">help & support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Section label */}
        <Text
          variant="eyebrow"
          style={[styles.sectionLabel, { color: colors.taupe }]}
        >
          frequently asked questions
        </Text>

        {/* FAQ list */}
        {FAQ_DATA.map((item, index) => (
          <FaqRow
            key={index}
            item={item}
            expanded={expandedIndex === index}
            onToggle={() => toggleFaq(index)}
            colors={colors}
          />
        ))}

        {/* Contact section */}
        <Text
          variant="eyebrow"
          style={[styles.sectionLabel, styles.contactLabel, { color: colors.taupe }]}
        >
          still need help?
        </Text>

        <View
          style={[
            styles.contactCard,
            { backgroundColor: colors.pearl, borderColor: colors.mist },
          ]}
        >
          <View style={styles.contactContent}>
            <View
              style={[
                styles.contactIcon,
                { backgroundColor: colors.teal + "14" },
              ]}
            >
              <Feather name="mail" size={16} color={colors.teal} />
            </View>
            <View style={styles.contactText}>
              <Text style={[styles.contactTitle, { color: colors.ink }]}>
                contact us
              </Text>
              <Text style={[styles.contactEmail, { color: colors.stone }]}>
                hello@sotrip.app
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: colors.teal }]}
            onPress={handleContactUs}
            activeOpacity={0.85}
          >
            <Feather
              name="send"
              size={14}
              color="#FFFFFF"
              style={styles.contactBtnIcon}
            />
            <Text style={styles.contactBtnText}>send email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerSpacer: {
    width: 28,
  },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },

  /* Section label */
  sectionLabel: {
    paddingHorizontal: 4,
    marginBottom: spacing.sm,
  },

  /* FAQ cards */
  faqCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  faqQuestion: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    flex: 1,
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  faqBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  faqAnswer: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },

  /* Contact */
  contactLabel: {
    marginTop: spacing.xl,
  },
  contactCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: spacing.md,
  },
  contactContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  contactEmail: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 12,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 13,
  },
  contactBtnIcon: {
    marginRight: spacing.sm,
  },
  contactBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
