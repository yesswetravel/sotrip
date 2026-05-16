import { View, ViewProps, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { spacing, radii } from "../../theme/spacing";

interface CardProps extends ViewProps {}

export default function Card({ style, ...props }: CardProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.pearl,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});
