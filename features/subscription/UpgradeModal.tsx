import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "../design-system";
import { useColors } from "../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";
import { PAID_PRICE } from "./constants";

interface UpgradeModalProps {
  visible: boolean;
  limitMessage: string;
  onClose: () => void;
}

const BENEFITS = [
  "unlimited trips & activities",
  "all past trips archived forever",
  "export, offline & more",
];

export default function UpgradeModal({
  visible,
  limitMessage,
  onClose,
}: UpgradeModalProps) {
  const colors = useColors();
  const router = useRouter();

  function handleUpgrade() {
    onClose();
    router.push("/(auth)/paywall");
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.ivory }]}>
          <Text variant="title" style={styles.heading}>
            you've reached the limit
          </Text>

          <Text variant="body" style={[styles.message, { color: colors.stone }]}>
            {limitMessage}
          </Text>

          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Text variant="body" style={[styles.check, { color: colors.taupe }]}>
                  +
                </Text>
                <Text variant="body" style={[styles.benefitText, { color: colors.ink }]}>
                  {b}
                </Text>
              </View>
            ))}
          </View>

          <Text variant="caption" style={styles.price}>
            just ${PAID_PRICE} one-time — unlock forever
          </Text>

          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.ink }]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Text variant="body" style={[styles.upgradeBtnText, { color: colors.ivory }]}>
              upgrade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
            <Text variant="caption" style={[styles.later, { color: colors.stone }]}>
              maybe later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  heading: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  benefits: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  check: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  benefitText: {
    flex: 1,
  },
  price: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  upgradeBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
    marginBottom: 12,
  },
  upgradeBtnText: {
    fontFamily: "Inter_500Medium",
  },
  later: {
    paddingVertical: 8,
  },
});
