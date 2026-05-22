import { View, ViewProps, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../theme/ThemeProvider";
import { Cairn } from "./Cairn";

interface ContainerProps extends ViewProps {
  safe?: boolean;
  logo?: boolean;
}

export default function Container({ safe = true, logo = false, style, children, ...props }: ContainerProps) {
  const { theme } = useTheme();
  const Wrapper = safe ? SafeAreaView : View;

  return (
    <Wrapper
      style={[styles.container, { backgroundColor: theme.bg }, style]}
      {...props}
    >
      {logo && (
        <View style={styles.logoBar}>
          <Cairn size="sm" layout="horizontal" animate={false} />
        </View>
      )}
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  logoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
