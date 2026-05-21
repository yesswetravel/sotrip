import { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { colors } from "../../../theme/colors";
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
  { id: "destination", label: "destination icon", desc: "illustrated cover with city name", preview: "🏛️" },
  { id: "photo", label: "photo cover", desc: "your best photo, full bleed", preview: "📸" },
  { id: "couple", label: "couple / romantic", desc: "names, date, elegant layout", preview: "💕" },
];

const STORIES = [
  { id: "photos-only", label: "just photos", desc: "clean layouts, no text" },
  { id: "captions", label: "photos + AI captions", desc: "short poetic lines under photos" },
  { id: "full-story", label: "full story mode", desc: "AI writes day narratives & reflections" },
];

/* ------------------------------------------------------------------ */
/*  Selection chip                                                     */
/* ------------------------------------------------------------------ */

function Chip({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function MemoryWizardScreen() {
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

  if (!trip) return null;

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={20} color={colors.stone} />
        </TouchableOpacity>
        <Text variant="eyebrow" style={styles.headerTitle}>create memory book</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trip info */}
        <View style={styles.tripInfo}>
          <Text style={styles.tripName}>{trip.title.toLowerCase()}</Text>
          <Text variant="caption" style={styles.tripMeta}>
            {trip.trip_days.length} days · {trip.trip_days.flatMap((d) => d.trip_items).length} places
          </Text>
          <Text style={styles.tripAiNote}>
            AI will turn your photos, places & notes{"\n"}into a beautifully written memory book
          </Text>
        </View>

        {/* Step 1: Vibe */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>choose your vibe</Text>
          </View>
          <Text variant="caption" style={styles.sectionHint}>
            this sets the overall aesthetic of your book
          </Text>

          <View style={styles.vibeGrid}>
            {VIBES.map((v) => (
              <Chip key={v.id} selected={vibe === v.id} onPress={() => setVibe(v.id)}>
                <View style={styles.vibeContent}>
                  <Feather
                    name={v.icon}
                    size={18}
                    color={vibe === v.id ? colors.coral : colors.stone}
                  />
                  <Text
                    style={[
                      styles.vibeLabel,
                      vibe === v.id && styles.vibeLabelSelected,
                    ]}
                  >
                    {v.label}
                  </Text>
                  <Text variant="caption" style={styles.vibeDesc}>{v.desc}</Text>
                </View>
              </Chip>
            ))}
          </View>
        </View>

        {/* Step 2: Cover */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>cover style</Text>
          </View>

          <View style={styles.coverGrid}>
            {COVERS.map((c) => (
              <Chip key={c.id} selected={cover === c.id} onPress={() => setCover(c.id)}>
                <View style={styles.coverContent}>
                  <Text style={styles.coverPreview}>{c.preview}</Text>
                  <Text
                    style={[
                      styles.coverLabel,
                      cover === c.id && styles.coverLabelSelected,
                    ]}
                  >
                    {c.label}
                  </Text>
                  <Text variant="caption" style={styles.coverDesc}>{c.desc}</Text>
                </View>
              </Chip>
            ))}
          </View>
        </View>

        {/* Step 3: Story mode */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>include stories?</Text>
          </View>

          <View style={styles.storyList}>
            {STORIES.map((s) => (
              <Pressable
                key={s.id}
                style={({ pressed }) => [
                  styles.storyRow,
                  storyMode === s.id && styles.storyRowSelected,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setStoryMode(s.id)}
              >
                <View style={styles.storyRadio}>
                  {storyMode === s.id && <View style={styles.storyRadioInner} />}
                </View>
                <View style={styles.storyText}>
                  <Text
                    style={[
                      styles.storyLabel,
                      storyMode === s.id && styles.storyLabelSelected,
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text variant="caption">{s.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Step 4: Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNum}>4</Text>
            </View>
            <Text style={styles.sectionTitle}>any notes for AI?</Text>
          </View>
          <Text variant="caption" style={styles.sectionHint}>
            optional — tell AI anything special to include
          </Text>

          <TextInput
            style={styles.notesInput}
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
          <View style={styles.summaryCard}>
            <Feather name="book" size={16} color={colors.coral} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>your book</Text>
              <Text variant="caption">
                {VIBES.find((v) => v.id === vibe)?.label} · {COVERS.find((c) => c.id === cover)?.label} · {STORIES.find((s) => s.id === storyMode)?.label}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Generate button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={!canGenerate || generating}
        >
          {generating ? (
            <Text style={styles.generateBtnText}>creating your book…</Text>
          ) : (
            <>
              <Feather name="star" size={16} color={colors.pearl} />
              <Text style={styles.generateBtnText}>generate memory book</Text>
            </>
          )}
        </TouchableOpacity>
        {!canGenerate && (
          <Text variant="caption" style={styles.bottomHint}>
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.stone,
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
    color: colors.ink,
    textAlign: "center",
  },
  tripMeta: {
    marginTop: 6,
    color: colors.stone,
  },
  tripAiNote: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 20,
  },

  /* Section */
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: colors.pearl,
  },
  sectionTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 20,
    color: colors.ink,
  },
  sectionHint: {
    color: colors.stone,
    marginBottom: 14,
    marginLeft: 32,
  },

  /* Chip */
  chip: {
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.mist,
    overflow: "hidden",
  },
  chipSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coral + "08",
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
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
    marginTop: 4,
  },
  vibeLabelSelected: {
    color: colors.coral,
  },
  vibeDesc: {
    fontSize: 11,
    color: colors.stone,
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
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: colors.ink,
    textAlign: "center",
  },
  coverLabelSelected: {
    color: colors.coral,
  },
  coverDesc: {
    fontSize: 9,
    textAlign: "center",
    color: colors.stone,
  },

  /* Story rows */
  storyList: {
    gap: 8,
  },
  storyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.mist,
    padding: 14,
  },
  storyRowSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coral + "08",
  },
  storyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.mist,
    alignItems: "center",
    justifyContent: "center",
  },
  storyRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coral,
  },
  storyText: {
    flex: 1,
    gap: 2,
  },
  storyLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.ink,
  },
  storyLabelSelected: {
    color: colors.coral,
  },

  /* Notes */
  notesInput: {
    backgroundColor: colors.pearl,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: 14,
    minHeight: 90,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    color: colors.ink,
    lineHeight: 22,
  },

  /* Summary */
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.coral + "0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.coral + "30",
    padding: 14,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
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
    backgroundColor: colors.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mist,
    alignItems: "center",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 32,
    width: "100%",
  },
  generateBtnDisabled: {
    opacity: 0.35,
  },
  generateBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.pearl,
    letterSpacing: 0.3,
  },
  bottomHint: {
    marginTop: 8,
    fontSize: 11,
    color: colors.sand,
  },
});
