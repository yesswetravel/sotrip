import { StyleSheet, View, ScrollView, TouchableOpacity, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { useToast } from "../../features/shared/toast-context";
import { spacing } from "../../theme/spacing";

const INVITE_LINK = "sotrip.app/invite/abc123";

export default function InvitePartnerScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();

  async function handleCopyLink() {
    await Clipboard.setStringAsync(`https://${INVITE_LINK}`);
    toast.show("link copied!");
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Join me on SoTrip! Plan our next trip together: https://${INVITE_LINK}`,
      });
    } catch {
      // user cancelled
    }
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
        <Text variant="eyebrow">invite partner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Illustration */}
        <View style={styles.illustrationArea}>
          <View style={[styles.iconCircle, { backgroundColor: colors.teal }]}>
            <Feather name="users" size={32} color="#FFFFFF" />
          </View>
          <Text
            variant="subtitle"
            style={[styles.illustrationLabel, { color: colors.ink }]}
          >
            plan trips together
          </Text>
        </View>

        {/* Description */}
        <Text
          variant="body"
          style={[styles.description, { color: colors.stone }]}
        >
          share this link with your travel partner so they can join your trips
        </Text>

        {/* Link box */}
        <View
          style={[
            styles.linkBox,
            { backgroundColor: colors.pearl, borderColor: colors.mist },
          ]}
        >
          <Text
            variant="body"
            style={[styles.linkText, { color: colors.ink }]}
            numberOfLines={1}
          >
            {INVITE_LINK}
          </Text>
          <TouchableOpacity onPress={handleCopyLink} activeOpacity={0.7}>
            <Feather name="copy" size={16} color={colors.stone} />
          </TouchableOpacity>
        </View>

        {/* Copy link button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.teal }]}
          onPress={handleCopyLink}
          activeOpacity={0.85}
        >
          <Feather
            name="clipboard"
            size={14}
            color="#FFFFFF"
            style={styles.btnIcon}
          />
          <Text style={styles.primaryBtnText}>copy link</Text>
        </TouchableOpacity>

        {/* Share button */}
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.ink }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Feather
            name="share"
            size={14}
            color={colors.ink}
            style={styles.btnIcon}
          />
          <Text style={[styles.outlineBtnText, { color: colors.ink }]}>
            share
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },

  /* Illustration */
  illustrationArea: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  illustrationLabel: {
    textAlign: "center",
  },

  /* Description */
  description: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },

  /* Link box */
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.lg,
  },
  linkText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 14,
    flex: 1,
    marginRight: spacing.sm,
  },

  /* Buttons */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
  },
  btnIcon: {
    marginRight: spacing.sm,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  outlineBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
});
