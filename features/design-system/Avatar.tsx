import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

type AvatarVariant = "self" | "partner" | "add";
type AvatarSize = "normal" | "mini";

interface AvatarProps {
  variant?: AvatarVariant;
  size?: AvatarSize;
  label?: string;
  style?: ViewStyle;
}

interface AvatarPairProps {
  size?: AvatarSize;
  style?: ViewStyle;
}

const DEFAULT_LABELS: Record<AvatarVariant, string> = {
  self: "P",
  partner: "L",
  add: "+",
};

export function Avatar({
  variant = "self",
  size = "normal",
  label,
  style,
}: AvatarProps) {
  const { theme } = useTheme();
  const isAdd = variant === "add";
  const isNormal = size === "normal";

  const dimension = isNormal ? 30 : 18;
  const fontSize = isNormal ? 10 : 8;
  const borderWidth = isAdd ? 0.5 : 1.5;

  const backgroundColor = isAdd
    ? "transparent"
    : variant === "self"
      ? theme.accent
      : theme.accent2;

  const borderColor = isAdd
    ? theme.stone
    : isNormal
      ? theme.bg
      : theme.pearl;

  const textColor = isAdd ? theme.stone : theme.pearl;
  const borderStyle: "solid" | "dashed" = isAdd ? "dashed" : "solid";
  const displayLabel = label ?? DEFAULT_LABELS[variant];

  return (
    <View
      style={[
        styles.circle,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor,
          borderWidth,
          borderColor,
          borderStyle,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize,
            color: textColor,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

export function AvatarPair({ size = "normal", style }: AvatarPairProps) {
  const overlap = size === "normal" ? -10 : -6;

  return (
    <View style={[styles.pair, style]}>
      <Avatar variant="self" size={size} />
      <Avatar variant="partner" size={size} style={{ marginLeft: overlap }} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  pair: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
});
