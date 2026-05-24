import { StyleSheet, View, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Feather } from "@expo/vector-icons";
import { Text } from "../design-system";
import { useColors } from "../theme/ThemeProvider";
import { useNetworkStatus } from "./hooks";
import { useOfflineStore } from "./store";

/**
 * Subtle banner at top of screen when app is offline.
 * Only shows when offline mode is enabled AND device has no connection.
 */
export default function OfflineBanner() {
  const colors = useColors();
  const isOnline = useNetworkStatus();
  const { enabled, syncing } = useOfflineStore();
  const slideAnim = useRef(new Animated.Value(-40)).current;

  const showBanner = !isOnline || syncing;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showBanner ? 0 : -40,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBanner]);

  if (!enabled && isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: !isOnline ? colors.stone : colors.teal,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Feather
        name={!isOnline ? "wifi-off" : "download-cloud"}
        size={12}
        color="#fff"
        style={styles.icon}
      />
      <Text variant="caption" style={styles.text}>
        {syncing
          ? "syncing for offline..."
          : !isOnline
            ? "offline mode · viewing cached data"
            : ""}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
});
