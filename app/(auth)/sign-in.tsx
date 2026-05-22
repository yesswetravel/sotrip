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
import { Text, Cairn } from "../../features/design-system";
import { useToast } from "../../features/shared/toast-context";
import { supabase } from "../../lib/supabase";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

const { width: SCREEN_W } = Dimensions.get("window");
const AUTO_ADVANCE_MS = 4000;

function buildSlides(colors: ReturnType<typeof useColors>) {
  return [
    {
      icon: "map" as const,
      accent: colors.coral,
      title: "plan beautifully",
      subtitle: "day-by-day itineraries\nthat feel like a magazine",
    },
    {
      icon: "camera" as const,
      accent: colors.gold,
      title: "capture moments",
      subtitle: "photos & notes that become\na keepsake memory book",
    },
    {
      icon: "users" as const,
      accent: colors.teal,
      title: "travel together",
      subtitle: "invite companions and\nplan adventures as one",
    },
  ];
}

export default function SignInScreen() {
  const colors = useColors();
  const SLIDES = buildSlides(colors);
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
      <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.ivory }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View style={[styles.emailScreen, { opacity: emailFade, backgroundColor: colors.ivory }]}>
          <TouchableOpacity style={styles.backBtn} onPress={goBackToWelcome} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.emailInner}>
            <Text variant="display" style={styles.emailTitle}>
              {isSignUp ? "create account" : "welcome back"}
            </Text>
            <Text variant="subtitle" style={[styles.emailSubtitle, { color: colors.stone }]}>
              {isSignUp ? "start planning your next adventure" : "sign in to continue your journey"}
            </Text>

            <View style={styles.inputGroup}>
              <View style={[styles.inputWrap, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
                <Feather name="mail" size={16} color={colors.stone} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
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
              <View style={[styles.inputWrap, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
                <Feather name="lock" size={16} color={colors.stone} />
                <TextInput
                  style={[styles.input, { color: colors.ink }]}
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
              style={[styles.submitBtn, { backgroundColor: colors.coral }, !canSubmit && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.pearl} size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.pearl }]}>{isSignUp ? "create account" : "sign in"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} activeOpacity={0.7} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: colors.taupe }]}>
                {isSignUp ? "already have an account? sign in" : "new here? create account"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
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
            {/* Cairn tower mark behind icon */}
            <View style={styles.decorMark}>
              <Cairn size="xl" layout="mark-only" animate={false} />
            </View>

            {/* Floating icon */}
            <Animated.View
              style={[
                styles.iconCircle,
                { backgroundColor: slide.accent + "14", transform: [{ translateY: iconFloats[i] }] },
              ]}
            >
              <Feather name={slide.icon} size={34} color={slide.accent} />
            </Animated.View>

            <Text variant="display" style={[styles.slideTitle, { color: colors.ink }]}>{slide.title}</Text>
            <Text variant="subtitle" style={[styles.slideSubtitle, { color: colors.stone }]}>{slide.subtitle}</Text>
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
        <View style={styles.brandWrap}>
          <Cairn size="md" layout="wordmark-only" animate={false} />
        </View>

        {/* Buttons */}
        <Animated.View style={[styles.btnsWrap, { opacity: btnsFade }]}>
          <TouchableOpacity style={[styles.appleBtn, { backgroundColor: colors.ink }]} onPress={() => show("apple sign-in coming soon")} activeOpacity={0.85}>
            <Feather name="smartphone" size={17} color={colors.pearl} />
            <Text style={[styles.appleBtnText, { color: colors.pearl }]}>continue with apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.googleBtn, { backgroundColor: colors.pearl, borderColor: colors.mist }]} onPress={() => show("google sign-in coming soon")} activeOpacity={0.85}>
            <Feather name="globe" size={17} color={colors.ink} />
            <Text style={[styles.googleBtnText, { color: colors.ink }]}>continue with google</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.mist }]} />
            <Text style={[styles.orText, { color: colors.sand }]}>or</Text>
            <View style={[styles.orLine, { backgroundColor: colors.mist }]} />
          </View>

          <TouchableOpacity style={[styles.emailBtn, { borderColor: colors.sand }]} onPress={showEmailForm} activeOpacity={0.7}>
            <Feather name="mail" size={15} color={colors.stone} />
            <Text style={[styles.emailBtnText, { color: colors.stone }]}>sign in with email</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.terms, { color: colors.sand }]}>
          by continuing, you agree to our terms{"\n"}of service and privacy policy
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  decorMark: {
    position: "absolute",
    bottom: "22%",
    left: 0,
    right: 0,
    alignItems: "center",
    opacity: 0.08,
    transform: [{ scale: 2.2 }],
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
  },
  slideSubtitle: {
    textAlign: "center",
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
  brandWrap: {
    marginBottom: 20,
    alignItems: "center",
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
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: 10,
  },
  appleBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingVertical: 15,
    marginBottom: 0,
  },
  googleBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
  },
  orText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
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
    borderRadius: 999,
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  emailBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },

  /* Terms */
  terms: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },

  /* Email form screen */
  emailScreen: {
    flex: 1,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 15 : 11,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  submitBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
  },
});
