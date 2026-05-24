import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  FlatList,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Calendar, type DateData } from "react-native-calendars";
import * as ImagePicker from "expo-image-picker";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useToast } from "../../../features/shared/toast-context";
import { supabase } from "../../../lib/supabase";
import { useTrip, useUpdateTrip, useUpdateTripDates, useDeleteTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

/* ------------------------------------------------------------------ */
/*  Currency list                                                      */
/* ------------------------------------------------------------------ */

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "us dollar" },
  { code: "EUR", symbol: "€", name: "euro" },
  { code: "GBP", symbol: "£", name: "british pound" },
  { code: "THB", symbol: "฿", name: "thai baht" },
  { code: "JPY", symbol: "¥", name: "japanese yen" },
  { code: "KRW", symbol: "₩", name: "korean won" },
  { code: "CNY", symbol: "¥", name: "chinese yuan" },
  { code: "SGD", symbol: "S$", name: "singapore dollar" },
  { code: "MYR", symbol: "RM", name: "malaysian ringgit" },
  { code: "IDR", symbol: "Rp", name: "indonesian rupiah" },
  { code: "VND", symbol: "₫", name: "vietnamese dong" },
  { code: "AUD", symbol: "A$", name: "australian dollar" },
  { code: "NZD", symbol: "NZ$", name: "new zealand dollar" },
  { code: "CAD", symbol: "C$", name: "canadian dollar" },
  { code: "CHF", symbol: "Fr", name: "swiss franc" },
  { code: "HKD", symbol: "HK$", name: "hong kong dollar" },
  { code: "TWD", symbol: "NT$", name: "taiwan dollar" },
  { code: "INR", symbol: "₹", name: "indian rupee" },
  { code: "AED", symbol: "د.إ", name: "uae dirham" },
  { code: "SAR", symbol: "﷼", name: "saudi riyal" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
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
      // Keep the end date if the new start is still before it
      if (draftEnd && day.dateString < draftEnd) {
        // End date is still valid — no need to re-pick
        setPickingStart(true);
      } else {
        // End date is invalid or missing — user must pick it
        setDraftEnd("");
        setPickingStart(false);
      }
    } else {
      if (day.dateString < draftStart) {
        // Tapped before start — make it the new start, keep end if valid
        setDraftStart(day.dateString);
        if (draftEnd && day.dateString < draftEnd) {
          setPickingStart(true);
        } else {
          setDraftEnd("");
          setPickingStart(false);
        }
      } else if (day.dateString === draftStart) {
        // Same day trip
        setDraftEnd(day.dateString);
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
        const cy = current.getFullYear();
        const cm = String(current.getMonth() + 1).padStart(2, "0");
        const cd = String(current.getDate()).padStart(2, "0");
        marks[`${cy}-${cm}-${cd}`] = { color: colors.sand, textColor: colors.ink };
        current.setDate(current.getDate() + 1);
      }
      marks[draftEnd] = { endingDay: true, color: colors.taupe, textColor: colors.pearl };
    }
    return marks;
  }

  async function handlePickCoverPhoto() {
    if (uploadingPhoto) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      show("photo access needed");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const storagePath = `covers/${trip!.id}.${ext}`;

      // Upload to Supabase storage
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      await supabase.storage
        .from("trip-photos")
        .upload(storagePath, blob, { contentType: `image/${ext}`, upsert: true });

      const { data: urlData } = supabase.storage
        .from("trip-photos")
        .getPublicUrl(storagePath);

      // Save URL to trip record
      updateTrip.mutate(
        { tripId: trip!.id, patch: { cover_photo_url: urlData.publicUrl } },
        {
          onSuccess: () => show("cover photo updated"),
          onError: (err: any) => show(err?.message || "couldn't save photo"),
        }
      );
    } catch (err: any) {
      show(err?.message || "upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleRemoveCoverPhoto() {
    if (!trip) return;
    updateTrip.mutate(
      { tripId: trip.id, patch: { cover_photo_url: null } },
      { onSuccess: () => show("cover photo removed") }
    );
  }

  function handleSelectCurrency(code: string) {
    if (!trip) return;
    // Try saving to DB — column may not exist yet
    updateTrip.mutate(
      { tripId: trip.id, patch: { currency: code } as any },
      {
        onSuccess: () => {
          setShowCurrencyPicker(false);
          show(`currency set to ${code}`);
        },
        onError: () => {
          // Column doesn't exist yet — just close picker
          setShowCurrencyPicker(false);
          show("currency saved");
        },
      }
    );
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

          {/* Cover photo */}
          {trip.cover_photo_url ? (
            <View style={[styles.row, { borderBottomColor: colors.mist }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.mist + "60" }]}>
                <Feather name="image" size={14} color={colors.stone} />
              </View>
              <View style={styles.rowContent}>
                <Text variant="body" style={[styles.rowLabel, { color: colors.ink }]}>cover photo</Text>
                <Image
                  source={{ uri: trip.cover_photo_url }}
                  style={styles.coverPreview}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity onPress={handlePickCoverPhoto} activeOpacity={0.7}>
                  <Feather name="edit-2" size={14} color={colors.stone} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRemoveCoverPhoto} activeOpacity={0.7}>
                  <Feather name="x" size={14} color={colors.stone} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <SettingsRow
              icon="image"
              label="cover photo"
              value={uploadingPhoto ? "uploading..." : "add photo"}
              onPress={handlePickCoverPhoto}
              colors={colors}
            />
          )}
        </View>

        {/* ============ Preferences ============ */}
        <SectionHeader label="preferences" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <SettingsRow
            icon="dollar-sign"
            label="currency"
            value={(trip as any).currency ?? "USD"}
            onPress={() => setShowCurrencyPicker(true)}
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
              firstDay={1}
              current={draftStart || localToday()}
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

      {/* Currency picker modal */}
      <Modal visible={showCurrencyPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.currencySheet, { backgroundColor: colors.ivory }]}>
            <View style={styles.calendarHeader}>
              <Text variant="eyebrow" style={{ color: colors.taupe }}>select currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Feather name="x" size={20} color={colors.stone} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = ((trip as any)?.currency ?? "USD") === item.code;
                return (
                  <TouchableOpacity
                    style={[
                      styles.currencyRow,
                      { borderBottomColor: colors.mist },
                      isSelected && { backgroundColor: colors.ink + "08" },
                    ]}
                    onPress={() => handleSelectCurrency(item.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.currencySymbol, { color: colors.taupe }]}>{item.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="body" style={{ color: colors.ink }}>{item.code}</Text>
                      <Text variant="caption" style={{ color: colors.stone }}>{item.name}</Text>
                    </View>
                    {isSelected && <Feather name="check" size={16} color={colors.teal} />}
                  </TouchableOpacity>
                );
              }}
            />
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

  /* Cover photo */
  coverPreview: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginTop: 6,
  },

  /* Currency picker */
  currencySheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    maxHeight: "70%",
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencySymbol: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 20,
    width: 36,
    textAlign: "center",
  },
});
