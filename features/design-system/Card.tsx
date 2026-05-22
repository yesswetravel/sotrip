import { View, ViewProps, StyleSheet } from "react-native";
import { spacing, radii } from "../../theme/spacing";
import { useTheme } from "../theme/ThemeProvider";

interface CardProps extends ViewProps {}

export default function Card({ style, ...props }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.pearl,
          borderColor: theme.mist,
          shadowColor: theme.ink,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});
