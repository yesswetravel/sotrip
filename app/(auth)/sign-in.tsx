import { useState, useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../../features/design-system";
import { useToast } from "../../features/shared/toast-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { APP_NAME } from "../../theme/brand";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const ONBOARDING_SLIDES = [
  {
    icon: "map" as const,
    iconColor: colors.coral,
    iconBg: colors.coral + "14",
    title: "plan beautifully",
    subtitle: "day-by-day itineraries that feel\nlike flipping through a magazine",
  },
  {
    icon: "camera" as const,
    iconColor: colors.gold,
    iconBg: colors.gold + "14",
    title: "capture moments",
    subtitle: "save photos, notes, and memories\nthat turn into a keepsake book",
  },
  {
    icon: "users" as const,
    iconColor: colors.teal,
    iconBg: colors.teal + "14",
    title: "travel together",
    subtitle: "invite friends to plan and share\nyour adventures in real-time",
  },
];

function DotIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

export default function SignInScreen() {
  const [step, setStep] = useState<"welcome" | "email">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const { show } = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  function showEmailForm() {
    setStep("email");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function goBackToWelcome() {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setStep("welcome"));
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        show("check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "something went wrong";
      show(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    show("google sign-in coming soon");
  }

  async function handleAppleAuth() {
    show("apple sign-in coming soon");
  }

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  if (step === "email") {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.emailScreen, { opacity: fadeAnim }]}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={goBackToWelcome} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.emailInner}>
            <Text variant="display" style={styles.emailTitle}>
              {isSignUp ? "create account" : "welcome back"}
            </Text>
            <Text variant="caption" style={styles.emailSubtitle}>
              {isSignUp ? "start planning your next adventure" : "sign in to continue"}
            </Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrap}>
                <Feather name="mail" size={16} color={colors.stone} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.sand}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrap}>
                <Feather name="lock" size={16} color={colors.stone} />
                <TextInput
                  style={styles.input}
                  placeholder="password"
                  placeholderTextColor={colors.sand}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.pearl} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isSignUp ? "create account" : "sign in"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              activeOpacity={0.7}
              style={styles.toggleBtn}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? "already have an account? sign in"
                  : "new here? create account"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Top: onboarding carousel */}
      <View style={styles.carouselArea}>
        <FlatList
          data={ONBOARDING_SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setSlideIndex(idx);
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={[styles.slideIcon, { backgroundColor: item.iconBg }]}>
                <Feather name={item.icon} size={32} color={item.iconColor} />
              </View>
              <Text variant="display" style={styles.slideTitle}>
                {item.title}
              </Text>
              <Text style={styles.slideSubtitle}>
                {item.subtitle}
              </Text>
            </View>
          )}
        />
        <DotIndicator count={ONBOARDING_SLIDES.length} activeIndex={slideIndex} />
      </View>

      {/* Bottom: auth section */}
      <View style={styles.authArea}>
        {/* Brand */}
        <Text style={styles.brandName}>{APP_NAME}</Text>
        <View style={styles.brandLine} />

        {/* Social buttons */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={handleAppleAuth}
          activeOpacity={0.85}
        >
          <Feather name="smartphone" size={18} color={colors.pearl} />
          <Text style={styles.socialBtnText}>continue with apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialBtn, styles.googleBtn]}
          onPress={handleGoogleAuth}
          activeOpacity={0.85}
        >
          <Feather name="globe" size={18} color={colors.ink} />
          <Text style={[styles.socialBtnText, styles.googleBtnText]}>continue with google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* Email button */}
        <TouchableOpacity
          style={styles.emailBtn}
          onPress={showEmailForm}
          activeOpacity={0.7}
        >
          <Feather name="mail" size={16} color={colors.stone} />
          <Text style={styles.emailBtnText}>sign in with email</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          by continuing, you agree to our terms of service{"\n"}and privacy policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ivory,
  },

  /* Carousel */
  carouselArea: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing.lg,
  },
  slide: {
    width: SCREEN_W,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  slideIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  slideTitle: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  slideSubtitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 17,
    color: colors.stone,
    textAlign: "center",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sand,
  },
  dotActive: {
    backgroundColor: colors.ink,
    width: 20,
    borderRadius: 3,
  },

  /* Auth area */
  authArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 50 : 32,
    alignItems: "center",
  },
  brandName: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 20,
    color: colors.ink,
    letterSpacing: 6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  brandLine: {
    width: 32,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.taupe,
    marginBottom: spacing.lg,
  },

  /* Social buttons */
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: 10,
  },
  socialBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
  },
  googleBtn: {
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
  },
  googleBtnText: {
    color: colors.ink,
  },

  /* Divider */
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginVertical: 14,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mist,
  },
  orText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: colors.sand,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  /* Email button */
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 999,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  emailBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.stone,
  },

  /* Terms */
  terms: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: colors.sand,
    textAlign: "center",
    lineHeight: 16,
  },

  /* Email form screen */
  emailScreen: {
    flex: 1,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: spacing.md,
    alignSelf: "flex-start",
  },
  emailInner: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
  },
  emailTitle: {
    fontSize: 28,
    marginBottom: 8,
  },
  emailSubtitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    color: colors.stone,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    gap: 10,
    marginBottom: spacing.md,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 15 : 11,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
  },
  submitBtn: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  toggleBtn: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  toggleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.taupe,
  },
});
