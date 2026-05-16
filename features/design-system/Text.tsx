import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { typography } from "../../theme";

type Variant = keyof typeof typography;

interface TextProps extends RNTextProps {
  variant?: Variant;
}

export default function Text({ variant = "body", style, ...props }: TextProps) {
  return <RNText style={[styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create(
  Object.fromEntries(
    Object.entries(typography).map(([key, value]) => [key, value])
  ) as Record<Variant, object>
);
