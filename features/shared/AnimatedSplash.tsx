import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

/* ------------------------------------------------------------------ */
/*  Cairn dot sizes (matching the brand mark)                          */
/* ------------------------------------------------------------------ */

const DOTS = [
  { size: 7, color: "#A47551" },   // smallest — accent (warm brown)
  { size: 10, color: "#A47551" },  // accent
  { size: 18, color: "#1E2A3A" },  // ink (navy)
  { size: 32, color: "#1E2A3A" },  // largest — ink
];

const DOT_GAP = 10;
const BG_COLOR = "#ECE6D6"; // ivory

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  /* Each dot fades + rises in */
  const dot0 = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  const dots = [dot0, dot1, dot2, dot3];

  /* Wordmark + tagline */
  const wordOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);

  /* Full screen fade-out */
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    const ease = Easing.bezier(0.4, 0, 0.2, 1);
    const rise = 500;

    // Dots stack up one by one
    dots.forEach((d, i) => {
      d.value = withDelay(
        200 + i * 180,
        withTiming(1, { duration: rise, easing: ease }),
      );
    });

    // Wordmark fades in after dots
    wordOpacity.value = withDelay(
      200 + 4 * 180 + 100,
      withTiming(1, { duration: 600, easing: ease }),
    );

    // Tagline fades in last
    tagOpacity.value = withDelay(
      200 + 4 * 180 + 400,
      withTiming(1, { duration: 600, easing: ease }),
    );

    // Hold for a moment, then fade everything out
    const totalAnimTime = 200 + 4 * 180 + 400 + 600 + 800;
    screenOpacity.value = withDelay(
      totalAnimTime,
      withTiming(0, { duration: 500, easing: ease }),
    );

    // Notify parent when done
    const timeout = setTimeout(() => {
      onFinish();
    }, totalAnimTime + 500);

    return () => clearTimeout(timeout);
  }, []);

  const makeDotStyle = (v: { value: number }) =>
    useAnimatedStyle(() => ({
      opacity: v.value,
      transform: [{ translateY: (1 - v.value) * 16 }],
    }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: (1 - wordOpacity.value) * 8 }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value * 0.65,
    transform: [{ translateY: (1 - tagOpacity.value) * 6 }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Cairn tower */}
      <View style={styles.tower}>
        {DOTS.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              {
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                backgroundColor: dot.color,
                marginTop: i === 0 ? 0 : DOT_GAP,
              },
              makeDotStyle(dots[i]),
            ]}
          />
        ))}
      </View>

      {/* Wordmark */}
      <Animated.View style={[styles.wordRow, wordStyle]}>
        <Text style={styles.wordSo}>So</Text>
        <Text style={styles.wordT}>T</Text>
        <Text style={styles.wordRip}>rip</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, tagStyle]}>
        THE TRIPS WE KEEP
      </Animated.Text>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG_COLOR,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  tower: {
    alignItems: "center",
    marginBottom: 20,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  wordSo: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 56,
    color: "#1E2A3A",
    lineHeight: 56,
  },
  wordT: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 56,
    color: "#A47551",
    lineHeight: 56,
  },
  wordRip: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 56,
    color: "#1E2A3A",
    lineHeight: 56,
  },
  tagline: {
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 10,
    letterSpacing: 4,
    paddingRight: 4,
    color: "#1E2A3A",
    marginTop: 10,
  },
});
