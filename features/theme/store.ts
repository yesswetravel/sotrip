import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ThemeKey, DEFAULT_THEME, PALETTES } from "../../theme/palettes";

const STORAGE_KEY = "sotrip-theme";

interface ThemeState {
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  themeKey: DEFAULT_THEME,

  setTheme: (key) => {
    if (!(key in PALETTES)) return;
    set({ themeKey: key });
    AsyncStorage.setItem(STORAGE_KEY, key).catch(() => {});
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw && raw in PALETTES) {
        set({ themeKey: raw as ThemeKey });
      }
    } catch {}
  },
}));
