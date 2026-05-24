import { Platform } from "react-native";
import { Router } from "expo-router";

/**
 * Safe back navigation.
 *
 * Pass `parent` when you know exactly where "back" should go
 * (e.g. settings sub-pages → profile, profile → me tab).
 * Without `parent`, uses browser history on web or router.back() on native.
 */
export function goBack(router: Router, parent?: string) {
  if (parent) {
    (router as any).navigate(parent);
    return;
  }

  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.history.length > 1
  ) {
    window.history.back();
  } else {
    try {
      router.back();
    } catch {
      router.replace("/(tabs)");
    }
  }
}
