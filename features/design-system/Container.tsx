import { View, ViewProps, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

interface ContainerProps extends ViewProps {
  safe?: boolean;
}

export default function Container({ safe = true, style, children, ...props }: ContainerProps) {
  const Wrapper = safe ? SafeAreaView : View;
  return (
    <Wrapper style={[styles.container, style]} {...props}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.lg,
  },
});
