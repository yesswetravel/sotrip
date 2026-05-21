import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_500Medium_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Inter_400Regular,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import { ToastProvider } from "../features/shared/toast-context";
import { useSession } from "../lib/use-session";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [subChecked, setSubChecked] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@subscription_status").then((val) => {
      setHasSubscription(!!val);
      setSubChecked(true);
    });
  }, []);

  useEffect(() => {
    if (loading || !subChecked) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuth) {
      if (!hasSubscription && (segments as string[])[1] !== "paywall") {
        router.replace("/(auth)/paywall");
      } else if (hasSubscription) {
        router.replace("/");
      }
    }
  }, [session, loading, segments, subChecked, hasSubscription]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthGate />
        </ToastProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
