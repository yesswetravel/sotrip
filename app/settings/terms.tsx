import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { APP_NAME } from "../../theme/brand";

const SECTIONS = [
  {
    title: "ACCEPTANCE OF TERMS",
    body: `By downloading, accessing, or using ${APP_NAME}, you agree to be bound by these terms of service. If you do not agree to these terms, please do not use the app. ${APP_NAME} is a travel planning and memory application designed for personal, non-commercial use. We reserve the right to refuse service to anyone for any reason at any time.`,
  },
  {
    title: "USER ACCOUNTS",
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account. You agree to notify us immediately of any unauthorized use of your account. ${APP_NAME} accounts are personal and may not be transferred or shared with third parties.`,
  },
  {
    title: "SUBSCRIPTION & PAYMENTS",
    body: `${APP_NAME} offers both free and paid tiers. The free tier includes limited features as described in our pricing page. Pro access is available as a one-time purchase. All payments are processed through your device's app store and are subject to their refund policies. Prices may change with reasonable notice. Any add-on purchases (such as PDF export) are separate transactions.`,
  },
  {
    title: "INTELLECTUAL PROPERTY",
    body: `The ${APP_NAME} app, including its design, features, and content (excluding user-generated content), is owned by ${APP_NAME} and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the app without prior written consent.`,
  },
  {
    title: "USER CONTENT",
    body: `You retain ownership of all content you create, upload, or share through ${APP_NAME}, including trip plans, photos, notes, and itineraries. By using the app, you grant ${APP_NAME} a limited, non-exclusive license to store, process, and display your content solely for the purpose of providing the service. We do not sell or share your content with third parties for advertising purposes.`,
  },
  {
    title: "LIMITATION OF LIABILITY",
    body: `${APP_NAME} is provided "as is" without warranties of any kind, express or implied. We do not guarantee the accuracy of travel information, venue details, or any third-party data displayed in the app. ${APP_NAME} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for the app.`,
  },
  {
    title: "CHANGES TO TERMS",
    body: `We may update these terms from time to time. When we make material changes, we will notify you through the app or via email. Your continued use of ${APP_NAME} after changes are posted constitutes acceptance of the updated terms. We encourage you to review these terms periodically.`,
  },
  {
    title: "CONTACT",
    body: `If you have any questions about these terms of service, please contact us at hello@sotrip.app. We aim to respond to all inquiries within 48 hours.`,
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const router = useRouter();

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
            terms of service
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* ---- Sections ---- */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text
              variant="eyebrow"
              style={[styles.sectionTitle, { color: colors.stone }]}
            >
              {section.title}
            </Text>
            <Text variant="body" style={[styles.sectionBody, { color: colors.ink }]}>
              {section.body}
            </Text>
          </View>
        ))}

        {/* ---- Footer ---- */}
        <Text variant="caption" style={[styles.footer, { color: colors.stone }]}>
          last updated: may 2026
        </Text>
      </ScrollView>
    </Container>
  );
}

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

  /* Sections */
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  sectionBody: {
    lineHeight: 22,
  },

  /* Footer */
  footer: {
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
