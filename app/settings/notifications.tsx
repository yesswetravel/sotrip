import { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Toggle row                                                          */
/* ------------------------------------------------------------------ */

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: colors.ink }]}>{label}</Text>
        <Text variant="caption" style={[styles.toggleDesc, { color: colors.stone }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.mist, true: colors.coral }}
        thumbColor={colors.pearl}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionTitle, { color: colors.sand }]}>{title}</Text>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();

  /* Local toggle state */
  const [tripReminders, setTripReminders] = useState(true);
  const [itineraryChanges, setItineraryChanges] = useState(true);
  const [newPhotos, setNewPhotos] = useState(true);
  const [partnerActivity, setPartnerActivity] = useState(true);
  const [inviteResponses, setInviteResponses] = useState(true);

  return (
    <Container safe logo>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ---- Header ---- */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => goBack(router, "/(tabs)/profile")}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="title" style={styles.headerTitle}>
            notifications
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* ---- Trips ---- */}
        <SectionHeader title="trips" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <ToggleRow
            label="trip reminders"
            description="get reminded before your trip"
            value={tripReminders}
            onToggle={setTripReminders}
          />
          <View style={[styles.separator, { backgroundColor: colors.mist }]} />
          <ToggleRow
            label="itinerary changes"
            description="when a companion edits the plan"
            value={itineraryChanges}
            onToggle={setItineraryChanges}
          />
        </View>

        {/* ---- Photos ---- */}
        <SectionHeader title="photos" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <ToggleRow
            label="new photos"
            description="when photos are added to your trip"
            value={newPhotos}
            onToggle={setNewPhotos}
          />
        </View>

        {/* ---- Social ---- */}
        <SectionHeader title="social" />
        <View style={[styles.card, { backgroundColor: colors.pearl }]}>
          <ToggleRow
            label="partner activity"
            description="when your partner joins or updates"
            value={partnerActivity}
            onToggle={setPartnerActivity}
          />
          <View style={[styles.separator, { backgroundColor: colors.mist }]} />
          <ToggleRow
            label="invite responses"
            description="when someone accepts your invite"
            value={inviteResponses}
            onToggle={setInviteResponses}
          />
        </View>
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    textAlign: "center",
  },

  /* Section */
  sectionTitle: {
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    fontFamily: "InstrumentSans_600SemiBold",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  /* Card */
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md,
  },

  /* Toggle */
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  toggleDesc: {
    fontSize: 12,
  },
});
