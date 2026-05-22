import { useEffect, useRef } from "react";
import { StyleSheet, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../theme/ThemeProvider";
import { typography } from "../../theme/typography";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ message, onDismiss, duration = 4000 }: ToastProps) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, duration);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <Animated.Text
      style={[
        styles.toast,
        { opacity, bottom: insets.bottom + 16, backgroundColor: colors.ink, color: colors.ivory },
      ]}
    >
      {message}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    textAlign: "center",
    ...Platform.select({
      web: { zIndex: 9999 },
      default: { elevation: 10 },
    }),
  },
});
