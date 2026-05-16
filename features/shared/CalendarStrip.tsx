import { useRef, useEffect } from "react";
import {
  ScrollView,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Text } from "../design-system";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const ITEM_WIDTH = 44;

interface CalendarStripProps {
  days: { dayNumber: number; date: string }[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
  todayDate?: string;
}

export default function CalendarStrip({
  days,
  selectedDay,
  onSelectDay,
  todayDate,
}: CalendarStripProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = days.findIndex((d) => d.dayNumber === selectedDay);
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, index * ITEM_WIDTH - 120),
        animated: true,
      });
    }
  }, [selectedDay]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => {
        const d = new Date(day.date + "T00:00:00");
        const weekday = WEEKDAYS[d.getDay()];
        const dateNum = d.getDate();
        const isSelected = day.dayNumber === selectedDay;
        const isToday = todayDate === day.date;

        return (
          <TouchableOpacity
            key={day.dayNumber}
            style={[
              styles.dayItem,
              isSelected && styles.dayItemSelected,
            ]}
            onPress={() => onSelectDay(day.dayNumber)}
            activeOpacity={0.7}
          >
            <Text
              variant="caption"
              style={[
                styles.weekday,
                isSelected && styles.textSelected,
              ]}
            >
              {weekday}
            </Text>
            <Text
              variant="body"
              style={[
                styles.dateNum,
                isSelected && styles.textSelected,
                isToday && !isSelected && styles.dateToday,
              ]}
            >
              {dateNum}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  dayItem: {
    width: ITEM_WIDTH,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  dayItemSelected: {
    backgroundColor: colors.ink,
  },
  weekday: {
    fontSize: 10,
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  textSelected: {
    color: colors.ivory,
  },
  dateToday: {
    color: colors.taupe,
  },
});
