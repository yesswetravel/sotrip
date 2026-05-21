import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Default labels per variant                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_LABELS: Record<AvatarVariant, string> = {
  self: "P",
  partner: "L",
  add: "+",
};

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

export function Avatar({
  variant = "self",
  size = "normal",
  label,
  style,
}: AvatarProps) {
  const isAdd = variant === "add";
  const isNormal = size === "normal";

  const dimension = isNormal ? 30 : 18;
  const fontSize = isNormal ? 10 : 8;
  const borderWidth = isAdd ? 0.5 : 1.5;

  const backgroundColor = isAdd
    ? "transparent"
    : variant === "self"
      ? colors.coral
      : colors.teal;

  const borderColor = isAdd
    ? colors.stone
    : isNormal
      ? colors.ivory
      : colors.pearl;

  const textColor = isAdd ? colors.stone : colors.pearl;
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

/* ------------------------------------------------------------------ */
/*  AvatarPair                                                         */
/* ------------------------------------------------------------------ */

export function AvatarPair({ size = "normal", style }: AvatarPairProps) {
  const overlap = size === "normal" ? -10 : -6;

  return (
    <View style={[styles.pair, style]}>
      {/* row-reverse means the first child renders on top (in front) */}
      <Avatar variant="self" size={size} />
      <Avatar variant="partner" size={size} style={{ marginLeft: overlap }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

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
