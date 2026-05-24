import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { APP_NAME } from "../../theme/brand";

const SECTIONS = [
  {
    title: "INFORMATION WE COLLECT",
    body: `When you use ${APP_NAME}, we collect information you provide directly, including your email address, display name, and profile details. We also collect trip data you create such as itineraries, destinations, dates, notes, budget entries, and packing lists. If you upload photos, we store the image files along with any metadata you provide such as captions and dates.`,
  },
  {
    title: "HOW WE USE YOUR DATA",
    body: `We use your information to provide, maintain, and improve the ${APP_NAME} service. This includes storing your trip plans, syncing data across your devices, enabling sharing with your travel companions, and generating memory books from your trips. We do not use your personal data for advertising or sell it to third parties.`,
  },
  {
    title: "DATA SHARING",
    body: `Your trip data is shared only with people you explicitly invite as trip companions. We do not share your personal information with third parties except as necessary to provide the service (such as our cloud infrastructure provider) or as required by law. We may share aggregated, anonymized usage statistics that cannot identify individual users.`,
  },
  {
    title: "PHOTO STORAGE",
    body: `Photos uploaded to ${APP_NAME} are stored securely using Supabase, our cloud infrastructure provider. Photos are associated with your account and specific trips. They are only accessible to you and any trip companions you have invited. We do not access, analyze, or use your photos for any purpose other than displaying them within the app. You may delete your photos at any time.`,
  },
  {
    title: "DATA RETENTION",
    body: `We retain your data for as long as your account is active. If you delete a trip, the associated data (itinerary items, notes, budget entries) is permanently removed from our servers within 30 days. If you delete your account, all of your data, including trips, photos, and personal information, is permanently deleted within 30 days of the request.`,
  },
  {
    title: "YOUR RIGHTS",
    body: `You have the right to access, correct, or delete your personal data at any time. You can export your trip data from within the app. You may request a complete copy of all data we hold about you by contacting us. If you are located in the European Economic Area, you have additional rights under GDPR, including the right to data portability and the right to restrict processing.`,
  },
  {
    title: "SECURITY",
    body: `We take reasonable measures to protect your data, including encryption in transit and at rest, secure authentication, and regular security reviews. Our infrastructure is hosted on Supabase with enterprise-grade security. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "CHILDREN'S PRIVACY",
    body: `${APP_NAME} is not intended for use by children under the age of 13. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 13, we will take steps to delete that information promptly. If you believe a child has provided us with personal data, please contact us immediately.`,
  },
  {
    title: "CONTACT",
    body: `If you have questions about this privacy policy or our data practices, please reach out. We are committed to transparency and will respond to your inquiries promptly.`,
  },
];

export default function PrivacyScreen() {
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
            privacy policy
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
        <View style={styles.footerWrap}>
          <Text variant="caption" style={[styles.footer, { color: colors.stone }]}>
            last updated: may 2026
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:hello@sotrip.app")}
            activeOpacity={0.7}
          >
            <Text
              variant="caption"
              style={[styles.emailLink, { color: colors.coral }]}
            >
              questions? email us at hello@sotrip.app
            </Text>
          </TouchableOpacity>
        </View>
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
  footerWrap: {
    alignItems: "center",
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  footer: {
    textAlign: "center",
  },
  emailLink: {
    textAlign: "center",
  },
});
