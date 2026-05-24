import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Calendar, type DateData } from "react-native-calendars";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useToast } from "../../../features/shared/toast-context";
import { useTrip, useUpdateTrip, useUpdateTripDates, useDeleteTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toLowerCase();
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text variant="eyebrow" style={[styles.sectionHeader, { color: colors.taupe }]}>
      {label}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings row                                                       */
/* ------------------------------------------------------------------ */

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  danger,
  chevron = true,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  chevron?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.mist }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, danger ? { backgroundColor: "#C4444414" } : { backgroundColor: colors.mist + "60" }]}>
        <Feather
          name={icon}
          size={14}
          color={danger ? "#C44" : colors.stone}
        />
      </View>
      <View style={styles.rowContent}>
        <Text
          variant="body"
          style={[styles.rowLabel, { color: colors.ink }, danger && { color: "#C44" }]}
        >
          {label}
        </Text>
        {value ? (
          <Text variant="caption" style={[styles.rowValue, { color: colors.stone }]} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {chevron && onPress && (
        <Feather name="chevron-right" size={14} color={colors.sand} />
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

export default function TripSettingsScreen() {
  const colors = useColors();
  const { show } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);
  const updateTrip = useUpdateTrip();
  const updateTripDates = useUpdateTripDates();
  const deleteTrip = useDeleteTrip();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDest, setEditingDest] = useState(false);
  const [destDraft, setDestDraft] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Date editing
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickingStart, setPickingStart] = useState(true);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  function openDatePicker() {
    setDraftStart(trip?.start_date ?? "");
    setDraftEnd(trip?.end_date ?? "");
    setPickingStart(true);
    setShowCalendar(true);
  }

  function handleDayPress(day: DateData) {
    if (pickingStart) {
      setDraftStart(day.dateString);
      setDraftEnd("");
      setPickingStart(false);
    } else {
      if (day.dateString < draftStart) {
        // Tapped before start — reset start
        setDraftStart(day.dateString);
        setDraftEnd("");
        setPickingStart(false);
      } else {
        setDraftEnd(day.dateString);
      }
    }
  }

  const [dateSaving, setDateSaving] = useState(false);

  function handleSaveDates() {
    if (!trip || !draftStart || !draftEnd || dateSaving) return;
    setDateSaving(true);
    updateTripDates.mutate(
      { tripId: trip.id, startDate: draftStart, endDate: draftEnd },
      {
        onSuccess: () => {
          setDateSaving(false);
          setShowCalendar(false);
          setPickingStart(true);
          show("dates updated");
        },
        onError: (err: any) => {
          setDateSaving(false);
          show(err?.message || "couldn't save dates");
        },
      }
    );
  }

  function getMarkedDates() {
    const marks: Record<string, object> = {};
    if (draftStart) {
      marks[draftStart] = { startingDay: true, color: colors.taupe, textColor: colors.pearl };
    }
    if (draftStart && draftEnd) {
      const current = new Date(draftStart + "T00:00:00");
      const last = new Date(draftEnd + "T00:00:00");
      current.setDate(current.getDate() + 1);
      while (current < last) {
        marks[current.toISOString().split("T")[0]] = { color: colors.sand, textColor: colors.ink };
        current.setDate(current.getDate() + 1);
      }
      marks[draftEnd] = { endingDay: true, color: colors.taupe, textColor: colors.pearl };
    }
    return marks;
  }

  const handleSaveTitle = useCallback(() => {
    if (!titleDraft.trim() || !trip) return;
    updateTrip.mutate({ tripId: trip.id, patch: { title: titleDraft.trim() } });
    setEditingTitle(false);
  }, [titleDraft, trip]);

  const handleSaveDest = useCallback(() => {
    if (!trip) return;
    updateTrip.mutate({
      tripId: trip.id,
      patch: { destination: destDraft.trim() || null },
    });
    setEditingDest(false);
  }, [destDraft, trip]);

  const handleArchive = useCallback(() => {
    if (!trip) return;
    updateTrip.mutate(
      { tripId: trip.id, patch: { is_archived: true } },
      { onSuccess: () => router.replace("/(tabs)") }
    );
  }, [trip]);

  function handleDeleteTrip() {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    deleteTrip.mutate(trip!.id, {
      onSuccess: () => router.replace("/(tabs)"),
    });
  }

  if (!trip) return <Container logo><ActivityIndicator size="small" style={{ marginTop: 40 }} /></Container>;

  return (
    <Container logo>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">{trip.title}</Text>
        <View style={{ width: 20 }} />
      </View>
      <View>
        <Text variant="display" style={styles.pageTitle}>
          trip settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============ Details ============ */}
        <SectionHeader label="details" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          {editingTitle ? (
            <View style={[styles.editRow, { borderBottomColor: colors.mist }]}>
              <TextInput
                style={[styles.editInput, { color: colors.ink, borderBottomColor: colors.teal }]}
                value={titleDraft}
                onChangeText={setTitleDraft}
                autoFocus
                placeholder="trip name"
                placeholderTextColor={colors.sand}
                returnKeyType="done"
                onSubmitEditing={handleSaveTitle}
              />
              <TouchableOpacity onPress={handleSaveTitle} activeOpacity={0.7}>
                <Feather name="check" size={16} color={colors.teal} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingTitle(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ) : (
            <SettingsRow
              icon="edit-3"
              label="trip name"
              value={trip.title}
              onPress={() => {
                setTitleDraft(trip.title);
                setEditingTitle(true);
              }}
              colors={colors}
            />
          )}

          {editingDest ? (
            <View style={[styles.editRow, { borderBottomColor: colors.mist }]}>
              <TextInput
                style={[styles.editInput, { color: colors.ink, borderBottomColor: colors.teal }]}
                value={destDraft}
                onChangeText={setDestDraft}
                autoFocus
                placeholder="destination"
                placeholderTextColor={colors.sand}
                returnKeyType="done"
                onSubmitEditing={handleSaveDest}
              />
              <TouchableOpacity onPress={handleSaveDest} activeOpacity={0.7}>
                <Feather name="check" size={16} color={colors.teal} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingDest(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ) : (
            <SettingsRow
              icon="map-pin"
              label="destination"
              value={trip.destination ?? "not set"}
              onPress={() => {
                setDestDraft(trip.destination ?? "");
                setEditingDest(true);
              }}
              colors={colors}
            />
          )}

          <SettingsRow
            icon="calendar"
            label="dates"
            value={`${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`}
            onPress={openDatePicker}
            colors={colors}
          />

          <SettingsRow
            icon="image"
            label="cover photo"
            value={trip.cover_photo_url ? "set" : "none"}
            colors={colors}
          />
        </View>

        {/* ============ Preferences ============ */}
        <SectionHeader label="preferences" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <SettingsRow
            icon="dollar-sign"
            label="currency"
            value="USD"
            colors={colors}
          />
          <SettingsRow
            icon="globe"
            label="timezone"
            value="auto-detect"
            colors={colors}
          />
        </View>

        {/* ============ Danger Zone ============ */}
        <SectionHeader label="danger zone" colors={colors} />
        <View style={[styles.card, styles.dangerCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <SettingsRow
            icon="archive"
            label="archive trip"
            onPress={handleArchive}
            chevron={false}
            colors={colors}
          />
          <TouchableOpacity
            style={styles.leaveRow}
            onPress={handleDeleteTrip}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#C4444414" }]}>
              <Feather name="trash-2" size={14} color="#C44" />
            </View>
            <View style={styles.rowContent}>
              <Text variant="body" style={styles.leaveText}>
                {confirmLeave
                  ? "tap again to confirm"
                  : "delete this trip"}
              </Text>
              <Text variant="caption" style={[styles.leaveHint, { color: colors.stone }]}>
                this cannot be undone
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarSheet, { backgroundColor: colors.ivory }]}>
            <View style={styles.calendarHeader}>
              <Text variant="eyebrow" style={{ color: colors.taupe }}>
                {pickingStart ? "tap start date" : draftEnd ? "dates selected" : "tap end date"}
              </Text>
              <TouchableOpacity onPress={() => { setShowCalendar(false); setPickingStart(true); }}>
                <Feather name="x" size={20} color={colors.stone} />
              </TouchableOpacity>
            </View>

            {/* Selected range display */}
            <View style={styles.dateRangeRow}>
              <View style={[styles.dateBox, draftStart ? { borderColor: colors.taupe } : { borderColor: colors.mist }]}>
                <Text variant="caption" style={{ color: colors.stone }}>start</Text>
                <Text variant="body" style={{ color: draftStart ? colors.ink : colors.mist }}>
                  {draftStart ? formatDate(draftStart) : "—"}
                </Text>
              </View>
              <Feather name="arrow-right" size={14} color={colors.stone} />
              <View style={[styles.dateBox, draftEnd ? { borderColor: colors.taupe } : { borderColor: colors.mist }]}>
                <Text variant="caption" style={{ color: colors.stone }}>end</Text>
                <Text variant="body" style={{ color: draftEnd ? colors.ink : colors.mist }}>
                  {draftEnd ? formatDate(draftEnd) : "—"}
                </Text>
              </View>
            </View>

            <Calendar
              key={draftStart || "today"}
              markingType="period"
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
              enableSwipeMonths
              current={draftStart || new Date().toISOString().split("T")[0]}
              theme={{
                backgroundColor: colors.ivory,
                calendarBackground: colors.ivory,
                textSectionTitleColor: colors.stone,
                selectedDayBackgroundColor: colors.taupe,
                selectedDayTextColor: colors.pearl,
                todayTextColor: colors.taupe,
                dayTextColor: colors.ink,
                textDisabledColor: colors.mist,
                monthTextColor: colors.ink,
                arrowColor: colors.taupe,
                textMonthFontFamily: "CormorantGaramond_500Medium",
                textMonthFontSize: 22,
                textDayFontFamily: "InstrumentSans_400Regular",
                textDayFontSize: 14,
                textDayHeaderFontFamily: "InstrumentSans_500Medium",
                textDayHeaderFontSize: 10,
              }}
            />

            <TouchableOpacity
              style={[
                styles.saveDatesBtn,
                { backgroundColor: draftStart && draftEnd ? colors.ink : colors.mist },
              ]}
              onPress={handleSaveDates}
              activeOpacity={0.85}
              disabled={!draftStart || !draftEnd || dateSaving}
            >
              {dateSaving ? (
                <ActivityIndicator size="small" color={colors.ivory} />
              ) : (
                <Text variant="body" style={{ color: colors.ivory, fontFamily: "InstrumentSans_500Medium", fontSize: 14 }}>
                  save dates
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    fontSize: 28,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  /* Sections */
  sectionHeader: {
    paddingHorizontal: 4,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  dangerCard: {
    borderColor: "#C4444430",
  },

  /* Settings row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: "InstrumentSans_500Medium",
  },
  rowValue: {
    fontSize: 12,
    marginTop: 1,
  },

  /* Edit inline */
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editInput: {
    flex: 1,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 14,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },

  /* Members */
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 13,
  },
  memberAvatarPending: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed" as any,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontFamily: "InstrumentSans_500Medium",
  },
  memberRole: {
    fontSize: 11,
    marginTop: 1,
  },
  memberAction: {
    padding: 8,
  },

  /* Invite code */
  inviteCodeSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  inviteCodeText: {
    fontFamily: "InstrumentSans_600SemiBold",
    fontSize: 26,
    letterSpacing: 4,
    paddingRight: 4,
    marginBottom: 6,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 13,
  },

  /* Leave / danger */
  leaveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  leaveText: {
    fontSize: 14,
    fontFamily: "InstrumentSans_500Medium",
    color: "#C44",
  },
  leaveHint: {
    fontSize: 11,
    marginTop: 1,
  },

  /* Calendar modal */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  calendarSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 2,
  },
  saveDatesBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
});
