import { colors } from "./colors";

export const typography = {
  /** Top-of-screen titles — Cormorant italic 500, 28px */
  display: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 28,
    lineHeight: 30,
    color: colors.ink,
  },
  /** Section titles — Cormorant 500, 22px */
  title: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 22,
    lineHeight: 24,
    color: colors.ink,
  },
  /** Place names, day labels — Cormorant italic 500, 22px */
  titleItalic: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 22,
    lineHeight: 24,
    color: colors.ink,
  },
  /** List item names — Cormorant italic 500, 18px */
  subtitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    lineHeight: 21,
    color: colors.ink,
  },
  /** Tiny labels above titles — Instrument Sans 500, 10px, uppercase */
  eyebrow: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 10,
    letterSpacing: 2,
    paddingRight: 2,
    textTransform: "uppercase" as const,
    color: colors.stone,
  },
  /** Place names in dense lists — Instrument Sans 500, 14px */
  body: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  /** Metadata, sub-text — Instrument Sans 400, 12px */
  caption: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.stone,
  },
} as const;
