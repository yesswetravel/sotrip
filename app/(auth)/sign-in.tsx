import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Container, Text } from "../../features/design-system";
import { useToast } from "../../features/shared/toast-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { APP_NAME } from "../../theme/brand";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { show } = useToast();

  async function handleSignIn() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "something went wrong";
      show(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container style={styles.container}>
      <View style={styles.center}>
        <Text variant="display" style={styles.wordmark}>
          {APP_NAME}
        </Text>
        <View style={styles.divider} />

        {sent ? (
          <>
            <Text variant="titleItalic" style={styles.message}>
              check your inbox
            </Text>
            <Text variant="caption" style={styles.subtext}>
              we sent a magic link to {email}
            </Text>
          </>
        ) : (
          <>
            <Text variant="eyebrow" style={styles.label}>
              sign in with email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.stone}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, !email.trim() && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={!email.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.ivory} size="small" />
              ) : (
                <Text variant="body" style={styles.buttonText}>
                  continue
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    gap: 16,
  },
  wordmark: {
    fontSize: 36,
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.taupe,
    marginBottom: 8,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.pearl,
  },
  button: {
    width: "100%",
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
  message: {
    textAlign: "center",
    marginTop: 8,
  },
  subtext: {
    textAlign: "center",
  },
});
