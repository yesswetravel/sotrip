import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { typography } from "../../theme";
import { useTheme } from "../theme/ThemeProvider";

type Variant = keyof typeof typography;

interface TextProps extends RNTextProps {
  variant?: Variant;
}

const INK_VARIANTS: Variant[] = ["display", "title", "titleItalic", "subtitle", "body"];
const STONE_VARIANTS: Variant[] = ["eyebrow", "caption"];

export default function Text({ variant = "body", style, ...props }: TextProps) {
  const { theme } = useTheme();

  const color = INK_VARIANTS.includes(variant)
    ? theme.ink
    : STONE_VARIANTS.includes(variant)
      ? theme.stone
      : theme.ink;

  return <RNText style={[typography[variant], { color }, style]} {...props} />;
}
