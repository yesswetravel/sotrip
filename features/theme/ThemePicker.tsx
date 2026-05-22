import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "./ThemeProvider";
import { PALETTES, type ThemeKey } from "../../theme/palettes";
import { spacing, radii } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import DSText from "../design-system/Text";

const THEME_KEYS: ThemeKey[] = ["riviera", "mocha", "forest"];

type Size = "sm" | "lg";

interface ThemePickerProps {
  size?: Size;
}

function SwatchDot({ color, size }: { color: string; size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0,0,0,0.08)",
      }}
    />
  );
}

function SmallPicker() {
  const { theme, themeKey, setTheme } = useTheme();

  return (
    <View
      style={[
        styles.smallRow,
        { borderColor: theme.mist },
      ]}
    >
      {THEME_KEYS.map((key) => {
        const palette = PALETTES[key];
        const active = key === themeKey;

        return (
          <Pressable
            key={key}
            onPress={() => setTheme(key)}
            style={[
              styles.smallDot,
              {
                borderColor: active ? theme.ink : "transparent",
                borderWidth: active ? 1.5 : 0.5,
                transform: [{ scale: active ? 1.05 : 1 }],
              },
            ]}
          >
            <View style={styles.smallSwatchInner}>
              <View style={[styles.swatchSlice, { backgroundColor: palette.swatches[0], borderTopLeftRadius: 11, borderBottomLeftRadius: 11 }]} />
              <View style={[styles.swatchSlice, { backgroundColor: palette.swatches[1] }]} />
              <View style={[styles.swatchSlice, { backgroundColor: palette.swatches[2], borderTopRightRadius: 11, borderBottomRightRadius: 11 }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function LargePicker() {
  const { theme, themeKey, setTheme } = useTheme();

  return (
    <View style={styles.largeGrid}>
      {THEME_KEYS.map((key) => {
        const palette = PALETTES[key];
        const active = key === themeKey;

        return (
          <Pressable
            key={key}
            onPress={() => setTheme(key)}
            style={[
              styles.largeCard,
              {
                backgroundColor: palette.bg,
                borderColor: active ? palette.ink : theme.mist,
                borderWidth: active ? 1 : StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.swatchRow}>
              {palette.swatches.map((c, i) => (
                <SwatchDot key={i} color={c} size={16} />
              ))}
            </View>
            <View>
              <DSText
                variant="subtitle"
                style={{ color: palette.ink }}
              >
                {palette.label}
              </DSText>
              <DSText
                variant="caption"
                style={{ color: palette.stone, marginTop: 4, fontSize: 10 }}
              >
                {palette.description}
              </DSText>
            </View>
            {active && (
              <View
                style={[
                  styles.checkBadge,
                  { backgroundColor: palette.accent },
                ]}
              >
                <Feather name="check" size={10} color={palette.pearl} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ThemePicker({ size = "sm" }: ThemePickerProps) {
  return size === "sm" ? <SmallPicker /> : <LargePicker />;
}

const styles = StyleSheet.create({
  smallRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.pill,
  },
  smallDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: "hidden",
  },
  smallSwatchInner: {
    flex: 1,
    flexDirection: "row",
  },
  swatchSlice: {
    flex: 1,
  },
  largeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  largeCard: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 10,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 4,
  },
  checkBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
