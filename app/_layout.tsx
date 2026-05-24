import { useEffect, useState, useCallback } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { ToastProvider } from "../features/shared/toast-context";
import { ThemeProvider } from "../features/theme/ThemeProvider";
import { AnimatedSplash } from "../features/shared/AnimatedSplash";
import { useSession } from "../lib/use-session";
import { useSubscriptionStore } from "../features/subscription/store";
import { DEMO_MODE } from "../features/trips/api";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

function AuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const hasSeenPaywall = useSubscriptionStore((s) => s.hasSeenPaywall);

  const BYPASS_AUTH = false;
  const setDemoSignedIn = useSubscriptionStore((s) => s.setDemoSignedIn);

  useEffect(() => {
    if (BYPASS_AUTH) {
      /* Auto-activate demo session so useTrips etc. have a valid userId */
      if (DEMO_MODE) setDemoSignedIn();
      const inAuth = segments[0] === "(auth)";
      if (inAuth) router.replace("/");
      return;
    }
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuth && (segments as string[])[1] !== "paywall") {
      if (!hasSeenPaywall) {
        router.replace("/(auth)/paywall");
      } else {
        router.replace("/");
      }
    } else if (session && !inAuth && !hasSeenPaywall) {
      router.replace("/(auth)/paywall");
    }
  }, [session, loading, segments, hasSeenPaywall]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthGate />
            {showSplash && <AnimatedSplash onFinish={handleSplashFinish} />}
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
