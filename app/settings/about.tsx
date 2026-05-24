import { StyleSheet, TouchableOpacity, View, ScrollView, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text, Cairn } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

const INFO_ROWS = [
  { label: "version", value: "1.0.0" },
  { label: "designed in", value: "singapore" },
];

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Container safe logo>
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
          about
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Logo ---- */}
        <View style={styles.logoSection}>
          <Cairn size="lg" layout="vertical" tagline animate={false} />
          <Text variant="caption" style={[styles.versionText, { color: colors.stone }]}>
            v1.0.0
          </Text>
        </View>

        {/* ---- Mission ---- */}
        <View style={[styles.missionCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <Text variant="titleItalic" style={[styles.missionTitle, { color: colors.ink }]}>
            plan beautifully, travel together
          </Text>
          <Text variant="body" style={[styles.missionBody, { color: colors.stone }]}>
            sotrip is for people who love luxury and aesthetics — plan trips
            with friends, family, or your partner, capture every moment, and
            turn them into beautiful memory books.
          </Text>
        </View>

        {/* ---- Info Card ---- */}
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          {INFO_ROWS.map((row, i) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.stone }]}>
                  {row.label}
                </Text>
                <Text style={[styles.infoValue, { color: colors.ink }]}>
                  {row.value}
                </Text>
              </View>
              {i < INFO_ROWS.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.mist }]}
                />
              )}
            </View>
          ))}
        </View>

        {/* ---- Contact ---- */}
        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
          onPress={() => Linking.openURL("mailto:hello@sotrip.app")}
          activeOpacity={0.7}
        >
          <Feather name="mail" size={15} color={colors.teal} />
          <Text style={[styles.contactText, { color: colors.ink }]}>hello@sotrip.app</Text>
        </TouchableOpacity>

        {/* ---- Copyright ---- */}
        <View style={styles.copyrightWrap}>
          <Text variant="caption" style={[styles.copyright, { color: colors.sand }]}>
            © 2026 sotrip. all rights reserved.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
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
  scroll: {
    paddingBottom: spacing.xxl,
  },

  /* Logo */
  logoSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  versionText: {
    marginTop: spacing.sm,
  },

  /* Mission */
  missionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  missionTitle: {
    textAlign: "center",
  },
  missionBody: {
    textAlign: "center",
    lineHeight: 22,
  },

  /* Info Card */
  card: {
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 14,
  },
  infoValue: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },

  /* Contact */
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    marginBottom: spacing.xl,
  },
  contactText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },

  /* Copyright */
  copyrightWrap: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  copyright: {
    fontSize: 10,
    fontFamily: "InstrumentSans_400Regular",
  },
});
