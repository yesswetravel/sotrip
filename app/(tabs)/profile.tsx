import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Container, Text } from "../../features/design-system";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/use-session";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export default function ProfileScreen() {
  const { session } = useSession();

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <Container style={styles.container}>
      <Text variant="display">profile</Text>
      <View style={styles.info}>
        <Text variant="caption">{session?.user.email}</Text>
      </View>
      <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.8}>
        <Text variant="body" style={styles.signOutText}>sign out</Text>
      </TouchableOpacity>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xl,
  },
  info: {
    marginTop: spacing.md,
  },
  signOut: {
    marginTop: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: {
    color: colors.stone,
  },
});
