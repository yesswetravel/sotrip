import { View, ViewProps, StyleSheet, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../theme/ThemeProvider";
import { Cairn } from "./Cairn";

interface ContainerProps extends ViewProps {
  safe?: boolean;
  logo?: boolean;
}

export default function Container({ safe = true, logo = false, style, children, ...props }: ContainerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const Wrapper = safe ? SafeAreaView : View;

  /* When safe={false} the logo must clear the status bar on its own */
  const logoTopPad = safe ? spacing.sm : Math.max(insets.top, Platform.OS === "android" ? 44 : 50);

  return (
    <Wrapper
      style={[styles.container, { backgroundColor: theme.bg }, style]}
      {...props}
    >
      {logo && (
        <View style={[styles.logoBar, { paddingTop: logoTopPad }]}>
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
    paddingBottom: spacing.md,
  },
});
