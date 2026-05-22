import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../theme/ThemeProvider";
import { MOTION } from "../../theme/motion";

export type CairnSize = "sm" | "md" | "lg" | "xl";
export type CairnLayout = "horizontal" | "vertical" | "mark-only" | "wordmark-only";

type Props = {
  size?: CairnSize;
  layout?: CairnLayout;
  tagline?: boolean;
  animate?: boolean;
  inverted?: boolean;
  onAccent?: boolean;
};

const SIZING: Record<CairnSize, { gap: number; tGap: number; d: number[]; word: number; sub: number }> = {
  sm: { gap: 10, tGap: 3, d: [2.5, 3.5, 6.5, 10], word: 22, sub: 7 },
  md: { gap: 18, tGap: 6, d: [4, 6, 12, 20], word: 36, sub: 9 },
  lg: { gap: 26, tGap: 8, d: [5, 8, 14, 24], word: 56, sub: 10 },
  xl: { gap: 34, tGap: 10, d: [7, 10, 18, 32], word: 76, sub: 12 },
};

export function Cairn({
  size = "md",
  layout = "horizontal",
  tagline = false,
  animate = true,
  inverted = false,
  onAccent = false,
}: Props) {
  const { theme } = useTheme();
  const s = SIZING[size];

  const inkColor = inverted || onAccent ? theme.pearl : theme.ink;
  const accentColor = onAccent ? theme.ink : theme.accent;
  const dotColors = onAccent
    ? [theme.ink, theme.ink, theme.pearl, theme.pearl]
    : inverted
      ? [theme.accent, theme.accent, theme.pearl, theme.pearl]
      : [theme.accent, theme.accent, theme.ink, theme.ink];

  const dot0 = useSharedValue(animate ? 0 : 1);
  const dot1 = useSharedValue(animate ? 0 : 1);
  const dot2 = useSharedValue(animate ? 0 : 1);
  const dot3 = useSharedValue(animate ? 0 : 1);
  const word = useSharedValue(animate ? 0 : 1);
  const sub = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const t = (val: { value: number }, delay: number) => {
      val.value = withDelay(
        delay,
        withTiming(1, {
          duration: MOTION.cairnRise,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
    };
    t(dot0, 0);
    t(dot1, 120);
    t(dot2, 240);
    t(dot3, 360);
    t(word, 480);
    t(sub, 700);
  }, [animate]);

  const makeDotStyle = (v: { value: number }) =>
    useAnimatedStyle(() => ({
      opacity: v.value,
      transform: [{ translateY: (1 - v.value) * 8 }],
    }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 4 }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: sub.value * (inverted ? 0.75 : onAccent ? 0.85 : 0.65),
    transform: [{ translateY: (1 - sub.value) * 4 }],
  }));

  const Tower = (
    <View style={{ alignItems: "center", flexDirection: "column" }}>
      {[dot0, dot1, dot2, dot3].map((dv, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: s.d[i],
              height: s.d[i],
              borderRadius: s.d[i] / 2,
              backgroundColor: dotColors[i],
              marginTop: i === 0 ? 0 : s.tGap,
            },
            makeDotStyle(dv),
          ]}
        />
      ))}
    </View>
  );

  const Word = (
    <Animated.View
      style={[{ flexDirection: "row", alignItems: "baseline" }, wordStyle]}
    >
      <Text
        style={{
          fontFamily: "CormorantGaramond_500Medium",
          fontSize: s.word,
          color: inkColor,
          lineHeight: s.word,
        }}
      >
        So
      </Text>
      <Text
        style={{
          fontFamily: "CormorantGaramond_500Medium_Italic",
          fontSize: s.word,
          color: accentColor,
          lineHeight: s.word,
        }}
      >
        T
      </Text>
      <Text
        style={{
          fontFamily: "CormorantGaramond_500Medium",
          fontSize: s.word,
          color: inkColor,
          lineHeight: s.word,
        }}
      >
        rip
      </Text>
    </Animated.View>
  );

  const Tagline = tagline ? (
    <Animated.Text
      style={[
        {
          fontFamily: "Inter_400Regular",
          fontSize: s.sub,
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          color: inkColor,
          marginTop: 8,
        },
        subStyle,
      ]}
    >
      the trips we keep
    </Animated.Text>
  ) : null;

  if (layout === "mark-only") return Tower;

  if (layout === "wordmark-only") {
    return (
      <View style={{ alignItems: "flex-start" }}>
        {Word}
        {Tagline}
      </View>
    );
  }

  if (layout === "vertical") {
    return (
      <View style={{ alignItems: "center", gap: s.tGap * 2 }}>
        {Tower}
        <View style={{ alignItems: "center" }}>
          {Word}
          {Tagline}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: s.gap }}>
      {Tower}
      <View style={{ flexDirection: "column" }}>
        {Word}
        {Tagline}
      </View>
    </View>
  );
}
