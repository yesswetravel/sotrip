import { StyleSheet, View, ScrollView, TouchableOpacity, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { useToast } from "../../features/shared/toast-context";
import { spacing } from "../../theme/spacing";

const APP_URL = "https://sotrip.app";

export default function ShareAppScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();

  async function handleShare() {
    try {
      await Share.share({
        message: `Plan beautiful trips together with SoTrip ✈️\n${APP_URL}`,
        title: "SoTrip",
      });
    } catch {
      // user cancelled
    }
  }

  async function handleCopyLink() {
    await Clipboard.setStringAsync(APP_URL);
    toast.show("link copied!");
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
        <Text variant="eyebrow">share sotrip</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Illustration */}
        <View style={styles.illustrationArea}>
          <View style={[styles.iconCircle, { backgroundColor: colors.coral }]}>
            <Feather name="share-2" size={32} color="#FFFFFF" />
          </View>
        </View>

        {/* Heading */}
        <Text variant="title" style={[styles.heading, { color: colors.ink }]}>
          spread the love
        </Text>

        {/* Body */}
        <Text
          variant="body"
          style={[styles.bodyText, { color: colors.stone }]}
        >
          share sotrip with friends and family who love to travel
        </Text>

        {/* Share button */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.coral }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather
            name="share-2"
            size={16}
            color="#FFFFFF"
            style={styles.btnIcon}
          />
          <Text style={styles.shareBtnText}>share sotrip</Text>
        </TouchableOpacity>

        {/* Copy link */}
        <TouchableOpacity
          style={styles.copyLinkBtn}
          onPress={handleCopyLink}
          activeOpacity={0.8}
        >
          <Text
            variant="caption"
            style={[styles.copyLinkText, { color: colors.stone }]}
          >
            or copy link
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

  /* Share button */
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignSelf: "stretch",
    marginBottom: spacing.lg,
  },
  shareBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 15,
    color: "#FFFFFF",
  },
  btnIcon: {
    marginRight: spacing.sm,
  },

  /* Copy link */
  copyLinkBtn: {
    paddingVertical: spacing.sm,
  },
  copyLinkText: {
    textDecorationLine: "underline",
  },
});
