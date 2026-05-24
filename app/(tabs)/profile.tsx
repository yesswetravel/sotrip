import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useSubscription } from "../../features/subscription/hooks";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Settings row                                                        */
/* ------------------------------------------------------------------ */

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger
              ? colors.coral + "14"
              : colors.teal + "14",
          },
        ]}
      >
        <Feather
          name={icon}
          size={15}
          color={danger ? colors.coral : colors.teal}
        />
      </View>
      <Text
        style={[
          styles.rowLabel,
          { color: colors.ink },
          danger && { color: colors.coral },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value ? (
        <Text
          style={[styles.rowValue, { color: colors.stone }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      ) : null}
      <Feather name="chevron-right" size={14} color={colors.sand} />
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionTitle, { color: colors.sand }]}>
      {title}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPaid } = useSubscription();

  return (
    <Container safe logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router, "/(tabs)/you-two")} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">settings</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Account ---- */}
        <SectionHeader title="account" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <SettingRow
            icon="user"
            label="edit profile"
            onPress={() => router.push("/settings/edit-profile")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="credit-card"
            label="your plan"
            value={isPaid ? "pro" : "free"}
            onPress={() => router.push("/settings/manage-plan")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="users"
            label="invite partner"
            onPress={() => router.push("/settings/invite-partner")}
          />
        </View>

        {/* ---- Preferences ---- */}
        <SectionHeader title="preferences" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <SettingRow
            icon="bell"
            label="notifications"
            onPress={() => router.push("/settings/notifications")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="moon"
            label="appearance"
            onPress={() => router.push("/settings/appearance")}
          />
        </View>

        {/* ---- Support ---- */}
        <SectionHeader title="support" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <SettingRow
            icon="help-circle"
            label="help & support"
            onPress={() => router.push("/settings/help")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="star"
            label="rate sotrip"
            onPress={() => router.push("/settings/rate-app")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="share-2"
            label="share with friends"
            onPress={() => router.push("/settings/share-app")}
          />
        </View>

        {/* ---- Legal ---- */}
        <SectionHeader title="legal" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <SettingRow
            icon="file-text"
            label="terms of service"
            onPress={() => router.push("/settings/terms")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="shield"
            label="privacy policy"
            onPress={() => router.push("/settings/privacy")}
          />
          <View
            style={[styles.separator, { backgroundColor: colors.mist }]}
          />
          <SettingRow
            icon="info"
            label="about"
            onPress={() => router.push("/settings/about")}
          />
        </View>

        {/* ---- Danger zone ---- */}
        <SectionHeader title="data & security" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <SettingRow
            icon="trash-2"
            label="delete account"
            danger
            onPress={() => router.push("/settings/delete-account")}
          />
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scroll: {
    paddingTop: spacing.sm,
  },

  /* Section */
  sectionTitle: {
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    fontFamily: "InstrumentSans_500Medium",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  /* Card group */
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: 14,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },

  /* Row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "InstrumentSans_500Medium",
  },
  rowValue: {
    fontSize: 12,
    fontFamily: "InstrumentSans_400Regular",
    maxWidth: 120,
  },
});
