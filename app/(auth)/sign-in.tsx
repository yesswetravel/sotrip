import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
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

const { width: SCREEN_W } = Dimensions.get("window");
const AUTO_ADVANCE_MS = 4000;

const SLIDES = [
  {
    icon: "map" as const,
    accent: colors.coral,
    title: "plan beautifully",
    subtitle: "day-by-day itineraries\nthat feel like a magazine",
    decorChar: "✦",
  },
  {
    icon: "camera" as const,
    accent: colors.gold,
    title: "capture moments",
    subtitle: "photos & notes that become\na keepsake memory book",
    decorChar: "◈",
  },
  {
    icon: "users" as const,
    accent: colors.teal,
    title: "travel together",
    subtitle: "invite companions and\nplan adventures as one",
    decorChar: "❋",
  },
];

export default function SignInScreen() {
  const [step, setStep] = useState<"welcome" | "email">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { show } = useToast();

  const emailFade = useRef(new Animated.Value(0)).current;
  const brandFade = useRef(new Animated.Value(0)).current;
  const brandSlide = useRef(new Animated.Value(20)).current;
  const btnsFade = useRef(new Animated.Value(0)).current;

  const slideOpacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const slideScales = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.9))).current;
  const iconFloats = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const dotWidths = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 24 : 6))).current;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entrance animation
  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(brandFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(brandSlide, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(btnsFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Floating icon animation
  useEffect(() => {
    iconFloats.forEach((anim) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 8, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    });
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Crossfade when activeIndex changes
  useEffect(() => {
    const anims = SLIDES.map((_, i) => {
      const isActive = i === activeIndex;
      return Animated.parallel([
        Animated.timing(slideOpacities[i], {
          toValue: isActive ? 1 : 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideScales[i], {
          toValue: isActive ? 1 : 0.9,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dotWidths[i], {
          toValue: isActive ? 24 : 6,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]);
    });
    Animated.parallel(anims).start();
  }, [activeIndex]);

  function goToSlide(idx: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIndex(idx);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
  }

  function showEmailForm() {
    setStep("email");
    Animated.timing(emailFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }

  function goBackToWelcome() {
    Animated.timing(emailFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setStep("welcome"));
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
        if (error) throw error;
        show("check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
        if (error) throw error;
      }
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.trim().length > 0;

  if (step === "email") {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View style={[styles.emailScreen, { opacity: emailFade }]}>
          <TouchableOpacity style={styles.backBtn} onPress={goBackToWelcome} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.emailInner}>
            <Text variant="display" style={styles.emailTitle}>
              {isSignUp ? "create account" : "welcome back"}
            </Text>
            <Text variant="subtitle" style={styles.emailSubtitle}>
              {isSignUp ? "start planning your next adventure" : "sign in to continue your journey"}
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
                <Text style={styles.submitBtnText}>{isSignUp ? "create account" : "sign in"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} activeOpacity={0.7} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>
                {isSignUp ? "already have an account? sign in" : "new here? create account"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Decorative corner accents */}
      <View style={styles.cornerTL}>
        <Text style={styles.cornerChar}>✦</Text>
      </View>
      <View style={styles.cornerBR}>
        <Text style={styles.cornerChar}>✦</Text>
      </View>

      {/* Hero carousel area — crossfade, not swipe */}
      <View style={styles.heroArea}>
        {SLIDES.map((slide, i) => (
          <Animated.View
            key={slide.title}
            style={[
              styles.slideAbsolute,
              { opacity: slideOpacities[i], transform: [{ scale: slideScales[i] }] },
            ]}
            pointerEvents={i === activeIndex ? "auto" : "none"}
          >
            {/* Decorative character behind icon */}
            <Text style={[styles.decorChar, { color: slide.accent + "18" }]}>{slide.decorChar}</Text>

            {/* Floating icon */}
            <Animated.View
              style={[
                styles.iconCircle,
                { backgroundColor: slide.accent + "14", transform: [{ translateY: iconFloats[i] }] },
              ]}
            >
              <Feather name={slide.icon} size={34} color={slide.accent} />
            </Animated.View>

            <Text variant="display" style={styles.slideTitle}>{slide.title}</Text>
            <Text variant="subtitle" style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </Animated.View>
        ))}

        {/* Tap to advance dots */}
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)} activeOpacity={0.7} hitSlop={8}>
              <Animated.View
                style={[
                  styles.dot,
                  { width: dotWidths[i], backgroundColor: i === activeIndex ? slide.accent : colors.sand },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Auth area */}
      <Animated.View style={[styles.authArea, { opacity: brandFade, transform: [{ translateY: brandSlide }] }]}>
        {/* Brand */}
        <Text style={styles.brandName}>{APP_NAME}</Text>
        <View style={styles.brandDot} />

        {/* Buttons */}
        <Animated.View style={[styles.btnsWrap, { opacity: btnsFade }]}>
          <TouchableOpacity style={styles.appleBtn} onPress={() => show("apple sign-in coming soon")} activeOpacity={0.85}>
            <Feather name="smartphone" size={17} color={colors.pearl} />
            <Text style={styles.appleBtnText}>continue with apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleBtn} onPress={() => show("google sign-in coming soon")} activeOpacity={0.85}>
            <Feather name="globe" size={17} color={colors.ink} />
            <Text style={styles.googleBtnText}>continue with google</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity style={styles.emailBtn} onPress={showEmailForm} activeOpacity={0.7}>
            <Feather name="mail" size={15} color={colors.stone} />
            <Text style={styles.emailBtnText}>sign in with email</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.terms}>
          by continuing, you agree to our terms{"\n"}of service and privacy policy
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ivory,
  },

  /* Decorative corners */
  cornerTL: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 24,
    zIndex: 10,
  },
  cornerBR: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 48 : 28,
    right: 24,
    zIndex: 10,
    transform: [{ rotate: "180deg" }],
  },
  cornerChar: {
    fontSize: 14,
    color: colors.mist,
  },

  /* Hero carousel */
  heroArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  slideAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  decorChar: {
    fontSize: 100,
    position: "absolute",
    top: "28%",
    fontWeight: "200",
    alignSelf: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 10,
    color: colors.ink,
  },
  slideSubtitle: {
    textAlign: "center",
    color: colors.stone,
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    position: "absolute",
    bottom: 16,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },

  /* Auth area */
  authArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    alignItems: "center",
  },
  brandName: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  brandDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.coral,
    marginBottom: 20,
  },
  btnsWrap: {
    width: "100%",
    alignItems: "center",
  },

  /* Social buttons */
  appleBtn: {
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
  appleBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: 0,
  },
  googleBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
    marginBottom: spacing.sm,
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
    marginTop: 4,
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
