import { useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Linking, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { useToast } from "../../features/shared/toast-context";
import { spacing } from "../../theme/spacing";

const STAR_COUNT = 5;

// Replace with your real App Store ID after first submission
const APP_STORE_ID = "6504567890";

export default function RateAppScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();
  const [rating, setRating] = useState(0);

  function handleRate() {
    toast.show("thank you for your support!");
    const url =
      Platform.OS === "ios"
        ? `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
        : `market://details?id=com.sotrip.app`;
    Linking.openURL(url).catch(() => {
      // App Store not available (e.g. web preview), just show toast
    });
    goBack(router, "/(tabs)/profile");
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
        <Text variant="eyebrow">rate sotrip</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Illustration */}
        <View style={styles.illustrationArea}>
          <View style={[styles.iconCircle, { backgroundColor: colors.gold }]}>
            <Feather name="star" size={32} color="#FFFFFF" />
          </View>
        </View>

        {/* Heading */}
        <Text variant="title" style={[styles.heading, { color: colors.ink }]}>
          enjoying sotrip?
        </Text>

        {/* Body */}
        <Text
          variant="body"
          style={[styles.bodyText, { color: colors.stone }]}
        >
          your review helps other travellers discover us
        </Text>

        {/* Star rating */}
        <View style={styles.starsRow}>
          {Array.from({ length: STAR_COUNT }).map((_, i) => {
            const filled = i < rating;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setRating(i + 1)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Feather
                  name="star"
                  size={36}
                  color={filled ? colors.gold : colors.sand}
                  style={filled ? styles.starFilled : undefined}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rate button */}
        <TouchableOpacity
          style={[
            styles.rateBtn,
            { backgroundColor: colors.ink },
            rating === 0 && styles.btnDisabled,
          ]}
          onPress={handleRate}
          activeOpacity={0.85}
          disabled={rating === 0}
        >
          <Text style={[styles.rateBtnText, { color: colors.ivory }]}>
            rate on app store
          </Text>
        </TouchableOpacity>

        {/* Maybe later */}
        <TouchableOpacity
          style={styles.laterBtn}
          onPress={() => goBack(router, "/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text
            variant="caption"
            style={[styles.laterText, { color: colors.stone }]}
          >
            maybe later
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}

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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
    alignItems: "center",
  },

  /* Illustration */
  illustrationArea: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Text */
  heading: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  bodyText: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },

  /* Stars */
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  starBtn: {
    padding: spacing.xs,
  },
  starFilled: {
    // Feather "star" is outlined; we rely on the gold color for visual weight.
    // A filled variant would need a custom SVG — this matches the Feather style.
  },

  /* Rate button */
  rateBtn: {
    alignSelf: "stretch",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  rateBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.4,
  },

  /* Maybe later */
  laterBtn: {
    paddingVertical: spacing.sm,
  },
  laterText: {
    textDecorationLine: "underline",
  },
});
