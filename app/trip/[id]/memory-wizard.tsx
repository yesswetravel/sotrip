import { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

const { width: SCREEN_W } = Dimensions.get("window");

/* ------------------------------------------------------------------ */
/*  Options data                                                       */
/* ------------------------------------------------------------------ */

const VIBES = [
  { id: "minimal", label: "minimal & clean", icon: "layout" as const, desc: "white space, serif type, quiet" },
  { id: "editorial", label: "editorial", icon: "book-open" as const, desc: "magazine spreads, bold headers" },
  { id: "romantic", label: "romantic & soft", icon: "heart" as const, desc: "blush tones, script type, dreamy" },
  { id: "bold", label: "bold & colorful", icon: "zap" as const, desc: "bright colors, big type, playful" },
  { id: "vintage", label: "vintage film", icon: "film" as const, desc: "grain, warm tones, retro feel" },
  { id: "luxe", label: "modern luxe", icon: "award" as const, desc: "dark, gold accents, premium" },
];

const COVERS = [
  { id: "destination", label: "destination icon", desc: "illustrated cover with city name", preview: "\u{1F3DB}\u{FE0F}" },
  { id: "photo", label: "photo cover", desc: "your best photo, full bleed", preview: "\u{1F4F8}" },
  { id: "couple", label: "couple / romantic", desc: "names, date, elegant layout", preview: "\u{1F495}" },
];

const STORIES = [
  { id: "photos-only", label: "just photos", desc: "clean layouts, no text" },
  { id: "captions", label: "photos + AI captions", desc: "short poetic lines under photos" },
  { id: "full-story", label: "full story mode", desc: "AI writes day narratives & reflections" },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function MemoryWizardScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [vibe, setVibe] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [storyMode, setStoryMode] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const canGenerate = vibe && cover && storyMode;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);

    const config = {
      vibe,
      cover,
      storyMode,
      notes: notes.trim(),
      tripId: id,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(`memory_config_${id}`, JSON.stringify(config));

    setTimeout(() => {
      router.replace(`/trip/${id}/memory`);
    }, 1500);
  }

  if (!trip) return <Container logo><ActivityIndicator size="small" style={{ marginTop: 40 }} /></Container>;

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">create memory book</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trip info */}
        <View style={styles.tripInfo}>
          <Text style={[styles.tripName, { color: colors.ink }]}>{trip.title.toLowerCase()}</Text>
          <Text variant="caption" style={{ marginTop: 6, color: colors.stone }}>
            {trip.trip_days.length} days · {trip.trip_days.flatMap((d) => d.trip_items).length} places
          </Text>
          <Text style={[styles.tripAiNote, { color: colors.stone }]}>
            AI will turn your photos, places & notes{"\n"}into a beautifully written memory book
          </Text>
        </View>

        {/* Step 1: Vibe */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.coral }]}>
              <Text style={[styles.stepNum, { color: colors.pearl }]}>1</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>choose your vibe</Text>
          </View>
          <Text variant="caption" style={[styles.sectionHint, { color: colors.stone }]}>
            this sets the overall aesthetic of your book
          </Text>

          <View style={styles.vibeGrid}>
            {VIBES.map((v) => (
              <Pressable
                key={v.id}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: colors.pearl, borderColor: colors.mist },
                  vibe === v.id && { borderColor: colors.coral, backgroundColor: colors.coral + "08" },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setVibe(v.id)}
              >
                <View style={styles.vibeContent}>
                  <Feather
                    name={v.icon}
                    size={18}
                    color={vibe === v.id ? colors.coral : colors.stone}
                  />
                  <Text
                    style={[
                      styles.vibeLabel,
                      { color: colors.ink },
                      vibe === v.id && { color: colors.coral },
                    ]}
                  >
                    {v.label}
                  </Text>
                  <Text variant="caption" style={{ fontSize: 11, color: colors.stone }}>{v.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Step 2: Cover */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.coral }]}>
              <Text style={[styles.stepNum, { color: colors.pearl }]}>2</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>cover style</Text>
          </View>

          <View style={styles.coverGrid}>
            {COVERS.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: colors.pearl, borderColor: colors.mist },
                  cover === c.id && { borderColor: colors.coral, backgroundColor: colors.coral + "08" },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setCover(c.id)}
              >
                <View style={styles.coverContent}>
                  <Text style={styles.coverPreview}>{c.preview}</Text>
                  <Text
                    style={[
                      styles.coverLabel,
                      { color: colors.ink },
                      cover === c.id && { color: colors.coral },
                    ]}
                  >
                    {c.label}
                  </Text>
                  <Text variant="caption" style={{ fontSize: 9, textAlign: "center", color: colors.stone }}>{c.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Step 3: Story mode */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.coral }]}>
              <Text style={[styles.stepNum, { color: colors.pearl }]}>3</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>include stories?</Text>
          </View>

          <View style={styles.storyList}>
            {STORIES.map((st) => (
              <Pressable
                key={st.id}
                style={({ pressed }) => [
                  styles.storyRow,
                  { backgroundColor: colors.pearl, borderColor: colors.mist },
                  storyMode === st.id && { borderColor: colors.coral, backgroundColor: colors.coral + "08" },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setStoryMode(st.id)}
              >
                <View style={[styles.storyRadio, { borderColor: colors.mist }]}>
                  {storyMode === st.id && <View style={[styles.storyRadioInner, { backgroundColor: colors.coral }]} />}
                </View>
                <View style={styles.storyText}>
                  <Text
                    style={[
                      styles.storyLabel,
                      { color: colors.ink },
                      storyMode === st.id && { color: colors.coral },
                    ]}
                  >
                    {st.label}
                  </Text>
                  <Text variant="caption">{st.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Step 4: Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.stepBadge, { backgroundColor: colors.coral }]}>
              <Text style={[styles.stepNum, { color: colors.pearl }]}>4</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>any notes for AI?</Text>
          </View>
          <Text variant="caption" style={[styles.sectionHint, { color: colors.stone }]}>
            optional — tell AI anything special to include
          </Text>

          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.pearl, borderColor: colors.mist, color: colors.ink }]}
            placeholder="e.g. include our anniversary dinner on day 3, mention the surprise sunset proposal…"
            placeholderTextColor={colors.sand}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        {canGenerate && (
          <View style={[styles.summaryCard, { backgroundColor: colors.coral + "0A", borderColor: colors.coral + "30" }]}>
            <Feather name="book" size={16} color={colors.coral} />
            <View style={styles.summaryText}>
              <Text style={[styles.summaryTitle, { color: colors.ink }]}>your book</Text>
              <Text variant="caption">
                {VIBES.find((v) => v.id === vibe)?.label} · {COVERS.find((c) => c.id === cover)?.label} · {STORIES.find((st) => st.id === storyMode)?.label}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Generate button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.ivory, borderTopColor: colors.mist }]}>
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: colors.ink }, !canGenerate && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={!canGenerate || generating}
        >
          {generating ? (
            <Text style={[styles.generateBtnText, { color: colors.pearl }]}>creating your book…</Text>
          ) : (
            <>
              <Feather name="star" size={16} color={colors.pearl} />
              <Text style={[styles.generateBtnText, { color: colors.pearl }]}>generate memory book</Text>
            </>
          )}
        </TouchableOpacity>
        {!canGenerate && (
          <Text variant="caption" style={{ marginTop: 8, fontSize: 11, color: colors.sand }}>
            select vibe, cover & story mode to continue
          </Text>
        )}
      </View>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Trip info */
  tripInfo: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  tripName: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 32,
    lineHeight: 36,
    textAlign: "center",
  },
  tripAiNote: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 20,
  },

  /* Section */
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 11,
  },
  sectionTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 20,
  },
  sectionHint: {
    marginBottom: 14,
    marginLeft: 32,
  },

  /* Chip */
  chip: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
  },

  /* Vibe grid */
  vibeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  vibeContent: {
    width: (SCREEN_W - spacing.lg * 2 - 10) / 2 - 3,
    padding: 14,
    gap: 4,
  },
  vibeLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
    marginTop: 4,
  },

  /* Cover grid */
  coverGrid: {
    flexDirection: "row",
    gap: 10,
  },
  coverContent: {
    width: (SCREEN_W - spacing.lg * 2 - 20) / 3 - 3,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  coverPreview: {
    fontSize: 28,
  },
  coverLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 11,
    textAlign: "center",
  },

  /* Story rows */
  storyList: {
    gap: 8,
  },
  storyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  storyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  storyRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storyText: {
    flex: 1,
    gap: 2,
  },
  storyLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },

  /* Notes */
  notesInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    minHeight: 90,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    lineHeight: 22,
  },

  /* Summary */
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
  },

  /* Bottom bar */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: "100%",
  },
  generateBtnDisabled: {
    opacity: 0.35,
  },
  generateBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
