import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Calendar, type DateData } from "react-native-calendars";
import { Container, Text } from "../../features/design-system";
import { goBack } from "../../lib/go-back";
import { useToast } from "../../features/shared/toast-context";
import { useCreateTrip, useTrips } from "../../features/trips/hooks";
import { useSession } from "../../lib/use-session";
import { useCanCreateTrip } from "../../features/subscription/hooks";
import { useColors } from "../../features/theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
}

export default function NewTripScreen() {
  const colors = useColors();
  const { session } = useSession();
  const router = useRouter();
  const createTrip = useCreateTrip();
  const { show } = useToast();
  const { data: existingTrips } = useTrips(session?.user.id);

  const activeCount = (existingTrips ?? []).filter((t) => {
    const _n = new Date();
    const today = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, "0")}-${String(_n.getDate()).padStart(2, "0")}`;
    return !t.end_date || t.end_date >= today;
  }).length;
  const { canCreate } = useCanCreateTrip(activeCount);

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [pickingStart, setPickingStart] = useState(true);

  const canSave = title.trim() && destination.trim() && startDate && endDate;

  function handleDayPress(day: DateData) {
    if (pickingStart) {
      setStartDate(day.dateString);
      if (endDate && day.dateString < endDate) {
        // End date still valid — keep it
        setPickingStart(true);
      } else {
        setEndDate("");
        setPickingStart(false);
      }
    } else {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        if (endDate && day.dateString < endDate) {
          setPickingStart(true);
        } else {
          setEndDate("");
          setPickingStart(false);
        }
      } else {
        setEndDate(day.dateString);
        setShowCalendar(false);
        setPickingStart(true);
      }
    }
  }

  function getMarkedDates() {
    const marks: Record<string, object> = {};
    if (startDate) {
      marks[startDate] = {
        startingDay: true,
        color: colors.taupe,
        textColor: colors.pearl,
      };
    }
    if (startDate && endDate) {
      const current = new Date(startDate + "T00:00:00");
      const last = new Date(endDate + "T00:00:00");
      current.setDate(current.getDate() + 1);
      while (current < last) {
        const cy = current.getFullYear();
        const cm = String(current.getMonth() + 1).padStart(2, "0");
        const cd = String(current.getDate()).padStart(2, "0");
        marks[`${cy}-${cm}-${cd}`] = {
          color: colors.sand,
          textColor: colors.ink,
        };
        current.setDate(current.getDate() + 1);
      }
      marks[endDate] = {
        endingDay: true,
        color: colors.taupe,
        textColor: colors.pearl,
      };
    }
    return marks;
  }

  async function handleSave() {
    if (!canSave) return;
    if (!canCreate) {
      show("upgrade to create more trips");
      router.back();
      return;
    }
    const userId = session?.user.id ?? "demo-user";
    try {
      const trip = await createTrip.mutateAsync({
        userId,
        input: {
          title: title.trim(),
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
        },
      });
      router.replace(`/trip/${trip.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "couldn't create trip";
      show(message);
    }
  }

  return (
    <Container logo>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBack(router)}>
            <Text variant="body" style={[styles.cancel, { color: colors.stone }]}>cancel</Text>
          </TouchableOpacity>
        </View>

        <Text variant="display" style={styles.title}>new trip</Text>

        <View style={styles.fields}>
          <TextInput
            style={[styles.input, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl }]}
            placeholder="where are you going?"
            placeholderTextColor={colors.stone}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={[styles.input, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl }]}
            placeholder="city or region"
            placeholderTextColor={colors.stone}
            value={destination}
            onChangeText={setDestination}
          />
          <TouchableOpacity
            style={[styles.dateButton, { borderColor: colors.sand, backgroundColor: colors.pearl }]}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.8}
          >
            <Text
              variant="body"
              style={startDate ? { color: colors.ink } : { color: colors.stone }}
            >
              {startDate && endDate
                ? `${formatDate(startDate)} — ${formatDate(endDate)}`
                : "select dates"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.save, { backgroundColor: colors.ink }, !canSave && styles.saveDisabled]}
          onPress={handleSave}
          disabled={!canSave || createTrip.isPending}
          activeOpacity={0.8}
        >
          {createTrip.isPending ? (
            <ActivityIndicator color={colors.ivory} size="small" />
          ) : (
            <Text variant="body" style={[styles.saveText, { color: colors.ivory }]}>save trip</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarSheet, { backgroundColor: colors.ivory }]}>
            <View style={styles.calendarHeader}>
              <Text variant="eyebrow">
                {pickingStart ? "select start date" : "select end date"}
              </Text>
              <TouchableOpacity onPress={() => { setShowCalendar(false); setPickingStart(true); }}>
                <Text variant="body" style={[styles.cancel, { color: colors.stone }]}>done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              markingType="period"
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
              enableSwipeMonths
              firstDay={1}
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
          </View>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.lg,
  },
  cancel: {
  },
  title: {
    marginBottom: spacing.xl,
  },
  fields: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 15,
  },
  dateButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  save: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontFamily: "InstrumentSans_500Medium",
  },
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
    marginBottom: spacing.md,
  },
});
