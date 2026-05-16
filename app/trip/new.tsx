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
import { useToast } from "../../features/shared/toast-context";
import { useCreateTrip } from "../../features/trips/hooks";
import { useSession } from "../../lib/use-session";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
}

export default function NewTripScreen() {
  const { session } = useSession();
  const router = useRouter();
  const createTrip = useCreateTrip();
  const { show } = useToast();

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
      setEndDate("");
      setPickingStart(false);
    } else {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
        setPickingStart(false);
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
        marks[current.toISOString().split("T")[0]] = {
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
    if (!canSave || !session) return;
    try {
      const trip = await createTrip.mutateAsync({
        userId: session.user.id,
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
    <Container>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text variant="body" style={styles.cancel}>cancel</Text>
          </TouchableOpacity>
        </View>

        <Text variant="display" style={styles.title}>new trip</Text>

        <View style={styles.fields}>
          <TextInput
            style={styles.input}
            placeholder="where are you going?"
            placeholderTextColor={colors.stone}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="city or region"
            placeholderTextColor={colors.stone}
            value={destination}
            onChangeText={setDestination}
          />
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.8}
          >
            <Text
              variant="body"
              style={startDate ? styles.dateText : styles.datePlaceholder}
            >
              {startDate && endDate
                ? `${formatDate(startDate)} — ${formatDate(endDate)}`
                : "select dates"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.save, !canSave && styles.saveDisabled]}
          onPress={handleSave}
          disabled={!canSave || createTrip.isPending}
          activeOpacity={0.8}
        >
          {createTrip.isPending ? (
            <ActivityIndicator color={colors.ivory} size="small" />
          ) : (
            <Text variant="body" style={styles.saveText}>save trip</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCalendar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarSheet}>
            <View style={styles.calendarHeader}>
              <Text variant="eyebrow">
                {pickingStart ? "select start date" : "select end date"}
              </Text>
              <TouchableOpacity onPress={() => { setShowCalendar(false); setPickingStart(true); }}>
                <Text variant="body" style={styles.cancel}>done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              markingType="period"
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
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
                textMonthFontFamily: "CormorantGaramond_500Medium",
                textMonthFontSize: 22,
                textDayFontFamily: "Inter_400Regular",
                textDayFontSize: 14,
                textDayHeaderFontFamily: "Inter_500Medium",
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
    color: colors.stone,
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
    borderColor: colors.sand,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.pearl,
  },
  dateButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.pearl,
  },
  dateText: {
    color: colors.ink,
  },
  datePlaceholder: {
    color: colors.stone,
  },
  save: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  calendarSheet: {
    backgroundColor: colors.ivory,
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
