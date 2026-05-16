import { colors } from "./colors";

export const typography = {
  display: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 28,
    color: colors.ink,
  },
  title: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 22,
    color: colors.ink,
  },
  titleItalic: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    color: colors.ink,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: colors.stone,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.stone,
  },
} as const;
