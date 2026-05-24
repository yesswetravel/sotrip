import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { useSubscriptionStore } from "../../features/subscription/store";
import { useToast } from "../../features/shared/toast-context";

const CONSEQUENCES = [
  "all your trips will be deleted",
  "all your photos will be removed",
  "your account data will be erased",
  "this cannot be undone",
];

export default function DeleteAccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === "DELETE";

  function handleDelete() {
    Alert.alert(
      "are you sure?",
      "this will permanently delete your account and all associated data. this action cannot be reversed.",
      [
        { text: "cancel", style: "cancel" },
        {
          text: "delete",
          style: "destructive",
          onPress: () => {
            useSubscriptionStore.getState().reset();
            toast.show("account deleted");
            router.dismissAll();
          },
        },
      ],
    );
  }

  return (
    <Container safe logo>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
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
            delete account
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* ---- Warning Icon ---- */}
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.coral }]}>
            <Feather name="alert-triangle" size={32} color="#fff" />
          </View>
        </View>

        {/* ---- Heading ---- */}
        <Text variant="title" style={[styles.heading, { color: colors.ink }]}>
          this action is permanent
        </Text>

        {/* ---- Consequences ---- */}
        <Text
          variant="body"
          style={[styles.explanationText, { color: colors.stone }]}
        >
          deleting your account means:
        </Text>

        <View style={styles.bulletList}>
          {CONSEQUENCES.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.coral }]} />
              <Text variant="body" style={[styles.bulletText, { color: colors.stone }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        {/* ---- Confirmation Input ---- */}
        <View style={styles.inputSection}>
          <Text
            variant="eyebrow"
            style={[styles.inputLabel, { color: colors.stone }]}
          >
            type DELETE to confirm
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.pearl,
                borderColor: colors.mist,
                color: colors.ink,
              },
            ]}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="type DELETE to confirm"
            placeholderTextColor={colors.sand}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* ---- Delete Button ---- */}
        <TouchableOpacity
          style={[
            styles.deleteBtn,
            { backgroundColor: colors.coral, opacity: isConfirmed ? 1 : 0.4 },
          ]}
          onPress={handleDelete}
          activeOpacity={0.85}
          disabled={!isConfirmed}
        >
          <Text style={styles.deleteBtnText}>delete my account</Text>
        </TouchableOpacity>
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

  /* Warning Icon */
  iconWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Heading */
  heading: {
    textAlign: "center",
    marginBottom: spacing.md,
  },

  /* Explanation */
  explanationText: {
    marginBottom: spacing.md,
  },

  /* Bullets */
  bulletList: {
    marginBottom: spacing.xl,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
  },

  /* Input */
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  input: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },

  /* Delete Button */
  deleteBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    color: "#fff",
  },
});
