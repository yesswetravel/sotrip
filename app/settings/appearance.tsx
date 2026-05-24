import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { ThemePicker } from "../../features/theme/ThemePicker";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

export default function AppearanceScreen() {
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
            appearance
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* ---- Theme Picker ---- */}
        <ThemePicker size="lg" />

        {/* ---- Preview ---- */}
        <View style={styles.previewSection}>
          <Text variant="eyebrow" style={[styles.previewLabel, { color: colors.stone }]}>
            preview
          </Text>
          <View style={[styles.previewCard, { backgroundColor: colors.pearl }]}>
            <Text variant="title" style={{ color: colors.ink }}>
              how it looks
            </Text>
            <Text variant="body" style={[styles.previewBody, { color: colors.stone }]}>
              your theme changes how every screen feels
            </Text>
            <View style={styles.previewSwatches}>
              <View style={[styles.swatch, { backgroundColor: colors.coral }]} />
              <View style={[styles.swatch, { backgroundColor: colors.teal }]} />
              <View style={[styles.swatch, { backgroundColor: colors.gold }]} />
              <View style={[styles.swatch, { backgroundColor: colors.ink }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

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

  /* Preview */
  previewSection: {
    marginTop: spacing.xl,
  },
  previewLabel: {
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  previewCard: {
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  previewBody: {
    lineHeight: 20,
  },
  previewSwatches: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
