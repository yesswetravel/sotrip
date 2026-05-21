export const colors = {
  /** Canvas / app background (warm cream-bone) */
  ivory: "#ECE6D6",
  /** Primary text + primary actions (warm navy — NOT black) */
  ink: "#1E2A3A",
  /** Hero accent · self avatar · primary CTA */
  coral: "#D87560",
  /** Secondary accent · partner avatar */
  teal: "#4A6E6B",
  /** Disabled / past states, strikethrough lines */
  sand: "#D6C6A2",
  /** Muted text, captions, secondary labels */
  stone: "#7C8290",
  /** Hairline dividers (0.5px), subtle borders */
  mist: "#DED7C5",
  /** Card / surface on canvas */
  pearl: "#F7F2E2",
  /** Default warm-photo placeholder tint */
  gold: "#B8956A",

  /* ---- Aliases for backward compatibility ---- */
  /** @deprecated use coral or gold for warm accents */
  taupe: "#B8956A",
  /** @deprecated use teal */
  moss: "#4A6E6B",
} as const;
