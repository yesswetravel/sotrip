import React, { createContext, useContext, useEffect } from "react";
import { useThemeStore } from "./store";
import { PALETTES, type Palette, type ThemeKey } from "../../theme/palettes";

interface ThemeContextValue {
  theme: Palette;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeKey = useThemeStore((s) => s.themeKey);
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  const value: ThemeContextValue = {
    theme: PALETTES[themeKey],
    themeKey,
    setTheme,
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function useColors() {
  const { theme } = useTheme();
  return {
    ivory: theme.bg,
    ink: theme.ink,
    coral: theme.accent,
    teal: theme.accent2,
    sand: theme.sand,
    stone: theme.stone,
    mist: theme.mist,
    pearl: theme.pearl,
    gold: theme.gold,
    taupe: theme.gold,
    moss: theme.accent2,
  };
}
