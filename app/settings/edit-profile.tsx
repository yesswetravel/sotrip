import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useSession } from "../../lib/use-session";
import { useToast } from "../../features/shared/toast-context";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

export default function EditProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session } = useSession();
  const toast = useToast();

  const email = session?.user.email ?? "";
  const initial = email.charAt(0).toUpperCase();

  const [displayName, setDisplayName] = useState(
    session?.user.user_metadata?.display_name ?? email.split("@")[0],
  );
  const [username, setUsername] = useState(email.split("@")[0]);

  function handleSave() {
    toast.show("profile updated");
  }

  function handleChangePhoto() {
    Alert.alert("coming soon", "photo upload will be available in a future update.");
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
            edit profile
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* ---- Avatar ---- */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleChangePhoto}
            activeOpacity={0.8}
            style={styles.avatarWrap}
          >
            <View style={[styles.avatar, { backgroundColor: colors.coral }]}>
              <Text style={[styles.avatarLetter, { color: colors.pearl }]}>
                {initial}
              </Text>
            </View>
            <View style={[styles.cameraBadge, { backgroundColor: colors.ink }]}>
              <Feather name="camera" size={12} color={colors.ivory} />
            </View>
          </TouchableOpacity>
          <Text variant="caption" style={[styles.changePhotoText, { color: colors.stone }]}>
            change photo
          </Text>
        </View>

        {/* ---- Display Name ---- */}
        <View style={styles.fieldGroup}>
          <Text variant="eyebrow" style={[styles.label, { color: colors.stone }]}>
            display name
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
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="your name"
            placeholderTextColor={colors.sand}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* ---- Username ---- */}
        <View style={styles.fieldGroup}>
          <Text variant="eyebrow" style={[styles.label, { color: colors.stone }]}>
            username
          </Text>
          <View style={styles.usernameWrap}>
            <Text style={[styles.atPrefix, { color: colors.sand }]}>@</Text>
            <TextInput
              style={[
                styles.input,
                styles.usernameInput,
                {
                  backgroundColor: colors.pearl,
                  borderColor: colors.mist,
                  color: colors.ink,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.sand}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* ---- Email (read-only) ---- */}
        <View style={styles.fieldGroup}>
          <Text variant="eyebrow" style={[styles.label, { color: colors.stone }]}>
            email
          </Text>
          <View
            style={[
              styles.input,
              styles.readOnly,
              {
                backgroundColor: colors.pearl,
                borderColor: colors.mist,
              },
            ]}
          >
            <Text style={[styles.readOnlyText, { color: colors.sand }]}>
              {email}
            </Text>
          </View>
        </View>

        {/* ---- Save ---- */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.coral }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>save</Text>
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

  /* Avatar */
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 36,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: {
    marginTop: spacing.sm,
  },

  /* Fields */
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
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
  usernameWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  atPrefix: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    marginRight: spacing.sm,
    marginLeft: 4,
  },
  usernameInput: {
    flex: 1,
  },
  readOnly: {
    justifyContent: "center",
  },
  readOnlyText: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 14,
  },

  /* Save */
  saveBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    color: "#fff",
  },
});
